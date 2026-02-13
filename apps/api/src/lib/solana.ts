import { Connection } from '@solana/web3.js'

export const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'

let connection: Connection | null = null

export function getConnection(): Connection {
  if (!connection) {
    console.log(`[Solana] Creating new connection to: ${RPC_URL}`)
    // Set aggressive timeouts to fail fast instead of hanging
    connection = new Connection(RPC_URL, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 30000,
      disableRetryOnRateLimit: true,
      fetch: (url, options) => {
        // Add timeout to all RPC requests
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout
        
        return fetch(url, {
          ...options,
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId))
      },
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
  let timeoutId: NodeJS.Timeout | undefined

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('Timeout getting latest blockhash from RPC'))
    }, timeoutMs)
  })

  try {
    const result = await Promise.race([connection.getLatestBlockhash('confirmed'), timeoutPromise])
    return result
  } finally {
    // Clean up timeout to prevent memory leaks
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}
