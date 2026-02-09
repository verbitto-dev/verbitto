import { Connection, Transaction } from '@solana/web3.js'
import { NextResponse, type NextRequest } from 'next/server'

const RPC = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'

/**
 * POST /api/v1/tx/send — Submit a signed transaction
 *
 * Body: {
 *   signedTransaction: "<base64 encoded signed transaction>"
 * }
 *
 * Returns: { signature: "<tx signature>" }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { signedTransaction } = body

        if (!signedTransaction) {
            return NextResponse.json(
                { error: 'Missing signedTransaction (base64 encoded)' },
                { status: 400 },
            )
        }

        const connection = new Connection(RPC, 'confirmed')
        const txBuffer = Buffer.from(signedTransaction, 'base64')
        const tx = Transaction.from(txBuffer)

        const signature = await connection.sendRawTransaction(txBuffer, {
            skipPreflight: false,
            preflightCommitment: 'confirmed',
        })

        // Wait for confirmation
        await connection.confirmTransaction(signature, 'confirmed')

        return NextResponse.json({
            signature,
            explorer: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
        })
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Transaction failed' },
            { status: 500 },
        )
    }
}
