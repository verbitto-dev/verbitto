import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Keypair } from '@solana/web3.js'
import type { CLIOptions } from './cli.js'

/**
 * Load wallet keypair from filesystem.
 * Searches multiple paths for compatibility with different deployment scenarios.
 */
export function loadWallet(options: CLIOptions): Keypair {
  const walletPaths: string[] = [
    options.wallet,
    join(process.env.HOME || '', '.config/solana/id.json'),
    join(process.cwd(), 'wallet.json'),
  ].filter((p): p is string => p !== null && p !== undefined)

  for (const walletPath of walletPaths) {
    if (existsSync(walletPath)) {
      try {
        const secretKey = Uint8Array.from(JSON.parse(readFileSync(walletPath, 'utf8')) as number[])
        const keypair = Keypair.fromSecretKey(secretKey)
        return keypair
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`❌ Failed to load wallet (${walletPath}):`, message)
      }
    }
  }

  console.error('❌ Wallet file not found. Searched paths:')
  for (const p of walletPaths) {
    console.error(`   - ${p}`)
  }
  console.error('\n💡 Generate a new wallet:')
  console.error('   solana-keygen new -o wallet.json')
  console.error('\n💡 Or specify a wallet path:')
  console.error('   verbitto-signer --wallet /path/to/wallet.json')
  process.exit(1)
}
