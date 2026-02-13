#!/usr/bin/env node
/**
 * Check platform account data directly from chain
 */

import { Connection, PublicKey } from '@solana/web3.js'
import { decodePlatform, getPlatformPda } from '@verbitto/program'

const RPC_URL = 'https://api.devnet.solana.com'

async function main() {
  const connection = new Connection(RPC_URL, 'confirmed')
  const platformPda = getPlatformPda()

  console.log('Platform PDA:', platformPda.toBase58())

  const accountInfo = await connection.getAccountInfo(platformPda)
  if (!accountInfo) {
    console.log('Platform account not found!')
    return
  }

  const platform = decodePlatform(Buffer.from(accountInfo.data))

  console.log('\nPlatform Data:')
  console.log('  authority:', platform.authority.toBase58())
  console.log('  taskCount:', platform.taskCount.toString())
  console.log('  totalSettledLamports:', platform.totalSettledLamports.toString())
  console.log('  totalSettledSOL:', Number(platform.totalSettledLamports) / 1e9)

  // Check if any transactions modified totalSettledLamports
  console.log('\nSearching transaction history for settle_task instruction...')
  const PROGRAM_ID = new PublicKey('FL4r4cpufpsdbhxLe4Gr3CMpPxAyeAu7WgRZHGb21Tor')
  const sigs = await connection.getSignaturesForAddress(PROGRAM_ID, { limit: 100 })

  for (const sig of sigs.slice(0, 10)) {
    const tx = await connection.getTransaction(sig.signature, {
      maxSupportedTransactionVersion: 0
    })
    if (tx?.meta?.logMessages) {
      const logs = tx.meta.logMessages.join('\n')
      if (logs.includes('settle_task') || logs.includes('Instruction: SettleTask')) {
        console.log(`Found settle_task in: ${sig.signature}`)
        console.log('Logs:', tx.meta.logMessages.filter(l => l.includes('Program log')).join('\n'))
      }
    }
  }
}

main().catch(console.error)
