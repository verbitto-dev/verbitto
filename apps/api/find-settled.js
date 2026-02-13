#!/usr/bin/env node
/**
 * Simple script to find TaskSettled events in Solana transaction history
 */

const PROGRAM_ID = 'FL4r4cpufpsdbhxLe4Gr3CMpPxAyeAu7WgRZHGb21Tor'
const RPC_URL = 'https://api.devnet.solana.com'

async function rpcCall(method, params) {
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params
    })
  })
  const data = await response.json()
  return data.result
}

async function main() {
  console.log('Fetching signatures...')
  const signatures = await rpcCall('getSignaturesForAddress', [PROGRAM_ID, { limit: 100 }])
  console.log(`Found ${signatures.length} signatures, checking each...`)

  let checked = 0
  let settled = []

  for (const sig of signatures) {
    if (sig.err) continue

    try {
      const tx = await rpcCall('getTransaction', [
        sig.signature,
        { maxSupportedTransactionVersion: 0 }
      ])

      if (tx?.meta?.logMessages) {
        const logs = tx.meta.logMessages.join('\n')
        if (logs.includes('TaskSettled')) {
          console.log(`✓ FOUND TaskSettled in ${sig.signature}`)
          settled.push(sig.signature)
        }
      }
      checked++
    } catch (err) {
      console.error(`Error checking ${sig.signature}:`, err.message)
    }
  }

  console.log(`\nChecked ${checked} transactions`)
  console.log(`Found ${settled.length} TaskSettled events`)

  if (settled.length > 0) {
    console.log('\nTaskSettled signatures:')
    settled.forEach(s => console.log(`  ${s}`))
  }
}

main().catch(console.error)
