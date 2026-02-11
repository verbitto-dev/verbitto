import * as fs from 'node:fs'
import * as path from 'node:path'
import { AnchorProvider, BN, Program, Wallet } from '@coral-xyz/anchor'
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js'

// Load IDL
const idlPath = path.join(__dirname, '../apps/web/public/idl.json')
const IDL = JSON.parse(fs.readFileSync(idlPath, 'utf8'))

const PROGRAM_ID = new PublicKey('Coxgjx4UMQZPRdDZT9CAdrvt4TMTyUKH79ziJiNFHk8S')

function getPlatformPda(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync([Buffer.from('platform')], PROGRAM_ID)
  return pda
}

async function main() {
  // Connect to devnet
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed')

  // Load keypair from environment or create new one
  let keypair: Keypair
  const keypairPath =
    process.env.ANCHOR_WALLET || path.join(process.env.HOME!, '.config/solana/id.json')

  try {
    const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf8'))
    keypair = Keypair.fromSecretKey(new Uint8Array(keypairData))
  } catch {
    console.error('Could not load keypair from', keypairPath)
    console.error(
      'Please set ANCHOR_WALLET environment variable or ensure ~/.config/solana/id.json exists'
    )
    process.exit(1)
  }

  // Check balance
  const balance = await connection.getBalance(keypair.publicKey)

  if (balance < 0.1 * 1e9) {
    console.error('Insufficient balance. Need at least 0.1 SOL')
    process.exit(1)
  }

  // Create provider
  const wallet = new Wallet(keypair)
  const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' })

  // Create program instance
  const program = new Program(IDL, provider)

  // Get platform PDA
  const platformPda = getPlatformPda()

  // Check if already initialized
  const existingAccount = await connection.getAccountInfo(platformPda)
  if (existingAccount) {
    process.exit(0)
  }

  // Initialize platform with reasonable defaults
  const feeBps = 250 // 2.5%
  const minBountyLamports = new BN(0.01 * 1e9) // 0.01 SOL minimum
  const disputeVotingPeriod = new BN(7 * 24 * 60 * 60) // 7 days
  const disputeMinVotes = 3
  const minVoterReputation = new BN(100)
  const claimGracePeriod = new BN(24 * 60 * 60) // 1 day

  try {
    const _tx = await program.methods
      .initializePlatform(
        feeBps,
        minBountyLamports,
        disputeVotingPeriod,
        disputeMinVotes,
        minVoterReputation,
        claimGracePeriod
      )
      .accounts({
        platform: platformPda,
        treasury: keypair.publicKey,
        authority: keypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc()
  } catch (err: unknown) {
    const error = err as { message?: string; logs?: unknown[] }
    console.error('Failed to initialize platform:', error.message)
    if (error.logs) {
      console.error('Program logs:', error.logs)
    }
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
