import { Connection, PublicKey } from '@solana/web3.js'
import { NextResponse } from 'next/server'

import {
    decodePlatform,
    DISCRIMINATOR,
    getPlatformPda,
    PROGRAM_ID,
} from '@/lib/program'

const RPC = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'

/** GET /api/v1/platform — Platform config (fees, limits, state) */
export async function GET() {
    try {
        const connection = new Connection(RPC, 'confirmed')
        const pda = getPlatformPda()
        const info = await connection.getAccountInfo(pda)

        if (!info) {
            return NextResponse.json(
                { error: 'Platform not initialized' },
                { status: 404 },
            )
        }

        const platform = decodePlatform(Buffer.from(info.data))

        return NextResponse.json({
            address: pda.toBase58(),
            authority: platform.authority.toBase58(),
            treasury: platform.treasury.toBase58(),
            feeBps: platform.feeBps,
            feePercent: `${platform.feeBps / 100}%`,
            minBountyLamports: platform.minBountyLamports.toString(),
            minBountySol: Number(platform.minBountyLamports) / 1e9,
            taskCount: platform.taskCount.toString(),
            templateCount: platform.templateCount.toString(),
            totalSettledLamports: platform.totalSettledLamports.toString(),
            totalSettledSol: Number(platform.totalSettledLamports) / 1e9,
            isPaused: platform.isPaused,
            disputeVotingPeriod: platform.disputeVotingPeriod.toString(),
            disputeMinVotes: platform.disputeMinVotes,
            minVoterReputation: platform.minVoterReputation.toString(),
            claimGracePeriod: platform.claimGracePeriod.toString(),
        })
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal error' },
            { status: 500 },
        )
    }
}
