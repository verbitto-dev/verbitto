import { Connection, PublicKey } from '@solana/web3.js'
import { NextResponse, type NextRequest } from 'next/server'

import { decodeTask, DISCRIMINATOR, PROGRAM_ID, TASK_STATUS } from '@/lib/program'

const RPC = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'

function serializeTask(task: ReturnType<typeof decodeTask>) {
    return {
        address: task.publicKey.toBase58(),
        title: task.title,
        status: task.status,
        creator: task.creator.toBase58(),
        agent: task.agent.toBase58(),
        bountyLamports: task.bountyLamports.toString(),
        bountySol: Number(task.bountyLamports) / 1e9,
        deadline: Number(task.deadline),
        deadlineIso: new Date(Number(task.deadline) * 1000).toISOString(),
        createdAt: Number(task.createdAt),
        reputationReward: Number(task.reputationReward),
        descriptionHash: Buffer.from(task.descriptionHash).toString('hex'),
        deliverableHash: Buffer.from(task.deliverableHash).toString('hex'),
        taskIndex: task.taskIndex.toString(),
        rejectionCount: task.rejectionCount,
    }
}

/**
 * GET /api/v1/tasks — List all tasks
 *
 * Query params:
 *   ?status=Open|Claimed|Submitted|...
 *   ?minBounty=0.5        (in SOL)
 *   ?creator=<pubkey>
 *   ?agent=<pubkey>
 *   ?active=true           (only tasks before deadline)
 *   ?limit=50
 *   ?offset=0
 */
export async function GET(request: NextRequest) {
    try {
        const connection = new Connection(RPC, 'confirmed')
        const { searchParams } = request.nextUrl

        const statusFilter = searchParams.get('status')
        const minBountyStr = searchParams.get('minBounty')
        const creatorStr = searchParams.get('creator')
        const agentStr = searchParams.get('agent')
        const activeOnly = searchParams.get('active') === 'true'
        const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 500)
        const offset = parseInt(searchParams.get('offset') ?? '0')

        const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
            filters: [
                {
                    memcmp: {
                        offset: 0,
                        bytes: DISCRIMINATOR.Task.toString('base64'),
                        encoding: 'base64',
                    },
                },
            ],
        })

        let tasks = accounts
            .map(({ pubkey, account }) => {
                try {
                    return decodeTask(pubkey, Buffer.from(account.data))
                } catch {
                    return null
                }
            })
            .filter((t): t is NonNullable<typeof t> => t !== null)
            .sort((a, b) => Number(b.createdAt - a.createdAt))

        // Filters
        if (statusFilter && TASK_STATUS.includes(statusFilter as any)) {
            tasks = tasks.filter(t => t.status === statusFilter)
        }
        if (minBountyStr) {
            const minLamports = BigInt(Math.floor(parseFloat(minBountyStr) * 1e9))
            tasks = tasks.filter(t => t.bountyLamports >= minLamports)
        }
        if (creatorStr) {
            try {
                const creatorKey = new PublicKey(creatorStr)
                tasks = tasks.filter(t => t.creator.equals(creatorKey))
            } catch { /* invalid pubkey, skip filter */ }
        }
        if (agentStr) {
            try {
                const agentKey = new PublicKey(agentStr)
                tasks = tasks.filter(t => t.agent.equals(agentKey))
            } catch { /* invalid pubkey, skip filter */ }
        }
        if (activeOnly) {
            const now = BigInt(Math.floor(Date.now() / 1000))
            tasks = tasks.filter(t => t.deadline > now)
        }

        const total = tasks.length
        const paginated = tasks.slice(offset, offset + limit)

        return NextResponse.json({
            total,
            offset,
            limit,
            tasks: paginated.map(serializeTask),
        })
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal error' },
            { status: 500 },
        )
    }
}
