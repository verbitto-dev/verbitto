import { Connection } from '@solana/web3.js'

export const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'

let connection: Connection | null = null

export function getConnection(): Connection {
  if (!connection) {
    // Set a reasonable timeout for RPC requests (30 seconds)
    connection = new Connection(RPC_URL, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 30000,
    })
  }
  return connection
}

/**
 * Get latest blockhash with timeout protection
 */
export async function getLatestBlockhashWithTimeout(
  connection: Connection,
  timeoutMs = 10000
): Promise<{ blockhash: string; lastValidBlockHeight: number }> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Timeout getting latest blockhash from RPC')), timeoutMs)
  })

  return Promise.race([connection.getLatestBlockhash('confirmed'), timeoutPromise])
}
