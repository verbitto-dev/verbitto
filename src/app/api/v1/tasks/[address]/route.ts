import { Connection, PublicKey } from '@solana/web3.js'
import { NextResponse } from 'next/server'

import { decodeTask, PROGRAM_ID } from '@/lib/program'

const RPC = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'

/** GET /api/v1/tasks/[address] — Get a single task by PDA address */
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ address: string }> },
) {
    try {
        const { address } = await params
        const connection = new Connection(RPC, 'confirmed')

        let pubkey: PublicKey
        try {
            pubkey = new PublicKey(address)
        } catch {
            return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
        }

        const info = await connection.getAccountInfo(pubkey)
        if (!info || !info.owner.equals(PROGRAM_ID)) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 })
        }

        const task = decodeTask(pubkey, Buffer.from(info.data))

        return NextResponse.json({
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
        })
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal error' },
            { status: 500 },
        )
    }
}
