#!/usr/bin/env node
/**
 * Check ALL transaction history on RPC to find terminal events
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
  console.log('Fetching ALL signatures...')
  const signatures = await rpcCall('getSignaturesForAddress', [PROGRAM_ID, { limit: 1000 }])
  console.log(`Found ${signatures.length} total signatures`)

  const validSigs = signatures.filter(s => !s.err)
  console.log(`Valid: ${validSigs.length}, Errors: ${signatures.length - validSigs.length}`)

  let checked = 0
  let found = {
    TaskSettled: [],
    TaskCancelled: [],
    TaskExpired: [],
    TaskApproved: [],
    SubmissionRejected: []
  }

  console.log('\nChecking transactions for terminal events...')
  for (const sig of validSigs) {
    try {
      const tx = await rpcCall('getTransaction', [
        sig.signature,
        { maxSupportedTransactionVersion: 0 }
      ])

      if (!tx) {
        console.log(`  ⚠ No data for ${sig.signature} (block ${sig.slot})`)
        continue
      }

      if (tx?.meta?.logMessages) {
        const logs = tx.meta.logMessages.join('\n')

        for (const eventName of Object.keys(found)) {
          if (logs.includes(eventName)) {
            console.log(`  ✓ Found ${eventName} in ${sig.signature}`)
            found[eventName].push({
              signature: sig.signature,
              slot: sig.slot,
              blockTime: sig.blockTime
            })
          }
        }
      }
      checked++
    } catch (err) {
      console.error(`  ✗ Error checking ${sig.signature}:`, err.message)
    }
  }

  console.log(`\n=== Summary ===`)
  console.log(`Checked: ${checked}/${validSigs.length} transactions`)
  console.log('\nTerminal Events Found:')
  for (const [event, sigs] of Object.entries(found)) {
    console.log(`  ${event}: ${sigs.length}`)
    if (sigs.length > 0) {
      sigs.forEach(s => {
        const date = s.blockTime ? new Date(s.blockTime * 1000).toISOString() : 'unknown'
        console.log(`    - ${s.signature} (${date})`)
      })
    }
  }
}

main().catch(console.error)
