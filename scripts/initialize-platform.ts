import * as anchor from '@coral-xyz/anchor'
import { AnchorProvider, type Program } from '@coral-xyz/anchor'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import type { TaskEscrow } from '../target/types/task_escrow.js'

// Platform configuration
const PLATFORM_CONFIG = {
  feeBps: 250, // 2.5% platform fee
  minBounty: 0.01 * LAMPORTS_PER_SOL, // Minimum task bounty 0.01 SOL
  votingPeriod: 259200, // Voting period 3 days (seconds)
  minVotes: 3, // Minimum votes
  minVoterReputation: 100, // Minimum voter reputation
  claimGracePeriod: 86400, // Grace period 1 day (seconds)
}

async function main() {
  // Setup provider
  const provider = AnchorProvider.env()
  anchor.setProvider(provider)

  const program = anchor.workspace.TaskEscrow as Program<TaskEscrow>

  console.log('🚀 Initializing platform...')
  console.log('Program ID:', program.programId.toString())
  console.log('Authority:', provider.wallet.publicKey.toString())

  // Derive Platform PDA
  const [platformPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('platform')],
    program.programId
  )
  console.log('Platform PDA:', platformPda.toString())

  // Check if platform is already initialized
  try {
    const existingPlatform = await program.account.platform.fetch(platformPda)
    console.log('⚠️  Platform already initialized')
    console.log('Platform config:', {
      feeBps: existingPlatform.feeBps,
      treasury: existingPlatform.treasury.toString(),
      taskCount: existingPlatform.taskCount.toString(),
      isPaused: existingPlatform.isPaused,
    })
    return
  } catch (_err) {
    // Platform not initialized, continue
    console.log('✅ Platform not initialized, starting initialization...')
  }

  // Treasury account (receives platform fees)
  // Use a multisig wallet in production
  const treasury = provider.wallet.publicKey
  console.log('Treasury:', treasury.toString())

  // Call initialize_platform
  try {
    const tx = await program.methods
      .initializePlatform(
        PLATFORM_CONFIG.feeBps,
        new BN(PLATFORM_CONFIG.minBounty),
        new BN(PLATFORM_CONFIG.votingPeriod),
        PLATFORM_CONFIG.minVotes,
        new BN(PLATFORM_CONFIG.minVoterReputation),
        new BN(PLATFORM_CONFIG.claimGracePeriod)
      )
      .accounts({
        treasury: treasury,
        authority: provider.wallet.publicKey,
      })
      .rpc()

    console.log('✅ Platform initialized successfully!')
    console.log('Transaction signature:', tx)

    // Fetch and display platform config
    const platform = await program.account.platform.fetch(platformPda)
    console.log('\n📋 Platform config:')
    console.log('  - Platform fee:', platform.feeBps, 'BPS (basis points)')
    console.log('  - Min bounty:', platform.minBountyLamports.toNumber() / LAMPORTS_PER_SOL, 'SOL')
    console.log('  - Voting period:', platform.disputeVotingPeriod.toNumber(), 'seconds')
    console.log('  - Min votes:', platform.disputeMinVotes)
    console.log('  - Min voter reputation:', platform.minVoterReputation.toString())
    console.log('  - Grace period:', platform.claimGracePeriod.toNumber(), 'seconds')
    console.log('  - Treasury:', platform.treasury.toString())
    console.log('  - Authority:', platform.authority.toString())
    console.log('  - Task count:', platform.taskCount.toString())
    console.log('  - Paused:', platform.isPaused)
  } catch (err) {
    console.error('❌ Initialization failed:', err)
    throw err
  }
}

main()
  .then(() => {
    console.log('\n🎉 Done!')
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
