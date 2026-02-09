import { Connection, PublicKey } from '@solana/web3.js'
import { NextResponse } from 'next/server'

import { DISCRIMINATOR, PROGRAM_ID } from '@/lib/program'

const RPC = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'

function decodeAgentProfile(pubkey: PublicKey, data: Buffer) {
    let offset = 8

    const authority = new PublicKey(data.subarray(offset, offset + 32))
    offset += 32
    const reputationScore = data.readBigInt64LE(offset)
    offset += 8
    const tasksCompleted = data.readBigUInt64LE(offset)
    offset += 8
    const tasksDisputed = data.readBigUInt64LE(offset)
    offset += 8
    const disputesWon = data.readBigUInt64LE(offset)
    offset += 8
    const totalEarnedLamports = data.readBigUInt64LE(offset)
    offset += 8
    const skillTags = data.readUInt8(offset)
    offset += 1

    const skills = ['DataLabeling', 'LiteratureReview', 'CodeReview',
        'Translation', 'Analysis', 'Research', 'Other']
        .filter((_, i) => (skillTags & (1 << i)) !== 0)

    return {
        address: pubkey.toBase58(),
        authority: authority.toBase58(),
        reputationScore: reputationScore.toString(),
        tasksCompleted: tasksCompleted.toString(),
        tasksDisputed: tasksDisputed.toString(),
        disputesWon: disputesWon.toString(),
        totalEarnedLamports: totalEarnedLamports.toString(),
        totalEarnedSol: Number(totalEarnedLamports) / 1e9,
        skillTags,
        skills,
        winRate: Number(tasksDisputed) > 0
            ? (Number(disputesWon) / Number(tasksDisputed) * 100).toFixed(1) + '%'
            : 'N/A',
    }
}

/** GET /api/v1/agents/[address] — Get agent profile by wallet address */
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ address: string }> },
) {
    try {
        const { address } = await params
        const connection = new Connection(RPC, 'confirmed')

        let walletKey: PublicKey
        try {
            walletKey = new PublicKey(address)
        } catch {
            return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
        }

        // Derive agent profile PDA from wallet address
        const [profilePda] = PublicKey.findProgramAddressSync(
            [Buffer.from('agent'), walletKey.toBuffer()],
            PROGRAM_ID,
        )

        const info = await connection.getAccountInfo(profilePda)
        if (!info) {
            return NextResponse.json({ error: 'Agent profile not found' }, { status: 404 })
        }

        const profile = decodeAgentProfile(profilePda, Buffer.from(info.data))

        // Also get SOL balance
        const balance = await connection.getBalance(walletKey)

        return NextResponse.json({
            ...profile,
            walletAddress: address,
            balanceLamports: balance.toString(),
            balanceSol: balance / 1e9,
        })
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal error' },
            { status: 500 },
        )
    }
}
