import { Connection } from '@solana/web3.js'

export const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'

let connection: Connection | null = null

export function getConnection(): Connection {
  if (!connection) {
    connection = new Connection(RPC_URL, 'confirmed')
  }
  return connection
}
