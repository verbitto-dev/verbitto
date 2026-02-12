import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Program } from '@coral-xyz/anchor'
import * as anchor from '@coral-xyz/anchor'
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import BN from 'bn.js'
import { expect } from 'chai'
import type { TaskEscrow } from '../target/types/task_escrow.js'

/**
 * Helper to bypass Anchor 0.31 type mismatch on camelCase account names.
 * Anchor IDL generates snake_case types but runtime accepts camelCase.
 */
function accs(obj: Record<string, unknown>): unknown {
  return obj
}

function loadOrGenerateWallet(name: string): Keypair {
  const walletFile = join(process.cwd(), 'tests', 'test-wallets.json')

  let wallets: Record<string, number[]> = {}
  if (existsSync(walletFile)) {
    try {
      const data = JSON.parse(readFileSync(walletFile, 'utf-8'))
      wallets = data.wallets || {}
    } catch (err) {
      console.warn(`Could not load test wallets: ${err}`)
    }
  }

  // Load existing wallet or generate new one
  let keypair: Keypair
  if (wallets[name]) {
    keypair = Keypair.fromSecretKey(Uint8Array.from(wallets[name]))
  } else {
    keypair = Keypair.generate()
    wallets[name] = Array.from(keypair.secretKey)

    // Save to file
    try {
      writeFileSync(
        walletFile,
        JSON.stringify(
          {
            description: 'Test wallets - DO NOT commit to git (add to .gitignore)',
            version: 1,
            wallets,
          },
          null,
          2
        )
      )
    } catch (err) {
      console.warn(`Could not save test wallet ${name}: ${err}`)
    }
  }

  return keypair
}

describe('task-escrow', () => {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)

  const program = anchor.workspace.TaskEscrow as Program<TaskEscrow>
  const authority = provider.wallet

  // Use persistent test wallets (saved to tests/test-wallets.json)
  // First run: generates new wallets and funds them (costs ~4 SOL)
  // Future runs: reuses same wallets (costs ~0.1 SOL for tx fees only!)
  const treasury = loadOrGenerateWallet('treasury')
  const creator = loadOrGenerateWallet('creator')
  const agent = loadOrGenerateWallet('agent')
  const voter1 = loadOrGenerateWallet('voter1')
  const voter2 = loadOrGenerateWallet('voter2')
  const voter3 = loadOrGenerateWallet('voter3')

  // PDAs
  let platformPda: PublicKey
  let _platformBump: number
  let creatorCounterPda: PublicKey
  let agentProfilePda: PublicKey
  let voter1ProfilePda: PublicKey
  let voter2ProfilePda: PublicKey
  let voter3ProfilePda: PublicKey
  let creatorTaskCount = 0

  const FEE_BPS = 250 // 2.5%
  const MIN_BOUNTY = 0.01 * LAMPORTS_PER_SOL
  const VOTING_PERIOD = 3 // 3 seconds for testing
  const MIN_VOTES = 2
  const MIN_VOTER_REPUTATION = 0 // allow any registered agent for tests
  const CLAIM_GRACE_PERIOD = 5 // 5 seconds grace period for testing

  before(async () => {
    // Derive platform PDA
    ;[platformPda, _platformBump] = PublicKey.findProgramAddressSync(
      [Buffer.from('platform')],
      program.programId
    )

      // Derive agent profile PDA
      ;[agentProfilePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('agent'), agent.publicKey.toBuffer()],
        program.programId
      )

      // Derive voter profile PDAs
      ;[voter1ProfilePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('agent'), voter1.publicKey.toBuffer()],
        program.programId
      )
      ;[voter2ProfilePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('agent'), voter2.publicKey.toBuffer()],
        program.programId
      )
      ;[voter3ProfilePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('agent'), voter3.publicKey.toBuffer()],
        program.programId
      )

      // Derive creator counter PDA
      ;[creatorCounterPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('creator'), creator.publicKey.toBuffer()],
        program.programId
      )

    // Transfer SOL to test accounts from provider wallet (avoid faucet rate limits)
    // Minimal amounts optimized for devnet airdrop limits (5 SOL/day)
    const minBalance = 0.1 * LAMPORTS_PER_SOL // Only transfer if balance < 0.1 SOL
    const transferAmount = 0.5 * LAMPORTS_PER_SOL // Transfer 0.5 SOL per account (enough for tests)
    for (const kp of [creator, agent, voter1, voter2, voter3]) {
      const balance = await provider.connection.getBalance(kp.publicKey)
      if (balance < minBalance) {
        try {
          const tx = new Transaction().add(
            SystemProgram.transfer({
              fromPubkey: provider.wallet.publicKey,
              toPubkey: kp.publicKey,
              lamports: transferAmount,
            })
          )
          await provider.sendAndConfirm(tx)
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          console.warn(
            `Transfer failed for ${kp.publicKey.toString().slice(0, 8)}..., error: ${message}`
          )
        }
      }
    }
  })

  // ─── Platform ──────────────────────────────────────────────

  it('initializes the platform', async () => {
    await program.methods
      .initializePlatform(
        FEE_BPS,
        new BN(MIN_BOUNTY),
        new BN(VOTING_PERIOD),
        MIN_VOTES,
        new BN(MIN_VOTER_REPUTATION),
        new BN(CLAIM_GRACE_PERIOD)
      )
      .accounts(
        accs({
          platform: platformPda,
          treasury: treasury.publicKey,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
      )
      .rpc()

    const platform = await program.account.platform.fetch(platformPda)
    expect(platform.feeBps).to.equal(FEE_BPS)
    expect(platform.treasury.toBase58()).to.equal(treasury.publicKey.toBase58())
    expect(platform.taskCount.toNumber()).to.equal(0)
  })

  // ─── Agent identity ────────────────────────────────────────

  it('registers an agent profile', async () => {
    const skillTags = 0b0000110 // LiteratureReview + CodeReview

    await program.methods
      .registerAgent(skillTags)
      .accounts(
        accs({
          agentProfile: agentProfilePda,
          authority: agent.publicKey,
          systemProgram: SystemProgram.programId,
        })
      )
      .signers([agent])
      .rpc()

    const profile = await program.account.agentProfile.fetch(agentProfilePda)
    expect(profile.authority.toBase58()).to.equal(agent.publicKey.toBase58())
    expect(profile.reputationScore.toNumber()).to.equal(0)
    expect(profile.tasksCompleted.toNumber()).to.equal(0)
    expect(profile.skillTags).to.equal(skillTags)
  })

  it('registers voter profiles for arbitration', async () => {
    for (const [voter, profilePda] of [
      [voter1, voter1ProfilePda],
      [voter2, voter2ProfilePda],
      [voter3, voter3ProfilePda],
    ] as const) {
      await program.methods
        .registerAgent(0b0000001) // DataLabeling
        .accounts(
          accs({
            agentProfile: profilePda as PublicKey,
            authority: (voter as Keypair).publicKey,
            systemProgram: SystemProgram.programId,
          })
        )
        .signers([voter as Keypair])
        .rpc()
    }

    const profile = await program.account.agentProfile.fetch(voter1ProfilePda)
    expect(profile.reputationScore.toNumber()).to.equal(0)
  })

  // ─── Task lifecycle: happy path ────────────────────────────

  describe('task lifecycle (happy path)', () => {
    const bounty = 1 * LAMPORTS_PER_SOL
    const title = 'Review DeSci paper on BRCA1 mutations'
    const descHash = Buffer.alloc(32, 1) // dummy hash
    const deliverableHash = Buffer.alloc(32, 2)
    let taskPda: PublicKey

    it('creates a task with SOL escrow', async () => {
      const taskIndex = new BN(creatorTaskCount)

        ;[taskPda] = PublicKey.findProgramAddressSync(
          [Buffer.from('task'), creator.publicKey.toBuffer(), taskIndex.toArrayLike(Buffer, 'le', 8)],
          program.programId
        )

      const deadline = Math.floor(Date.now() / 1000) + 3600 // 1 hour

      const _creatorBalanceBefore = await provider.connection.getBalance(creator.publicKey)

      await program.methods
        .createTask(
          title,
          Array.from(descHash) as any,
          new BN(bounty),
          new BN(creatorTaskCount),
          new BN(deadline),
          new BN(50) // reputation reward
        )
        .accounts(
          accs({
            task: taskPda,
            platform: platformPda,
            creatorCounter: creatorCounterPda,
            creator: creator.publicKey,
            systemProgram: SystemProgram.programId,
          })
        )
        .signers([creator])
        .rpc()

      creatorTaskCount++

      const task = await program.account.task.fetch(taskPda)
      expect(task.title).to.equal(title)
      expect(task.bountyLamports.toNumber()).to.equal(bounty)
      expect(task.status).to.deep.include({ open: {} })

      // Verify escrow: task PDA should hold bounty + rent
      const taskBalance = await provider.connection.getBalance(taskPda)
      expect(taskBalance).to.be.greaterThan(bounty)
    })

    it('agent claims the task', async () => {
      await program.methods
        .claimTask()
        .accounts(
          accs({
            task: taskPda,
            platform: platformPda,
            agentProfile: agentProfilePda,
            agent: agent.publicKey,
          })
        )
        .signers([agent])
        .rpc()

      const task = await program.account.task.fetch(taskPda)
      expect(task.status).to.deep.include({ claimed: {} })
      expect(task.agent.toBase58()).to.equal(agent.publicKey.toBase58())
    })

    it('agent submits deliverable', async () => {
      await program.methods
        .submitDeliverable(Array.from(deliverableHash) as any)
        .accounts(
          accs({
            task: taskPda,
            platform: platformPda,
            agent: agent.publicKey,
          })
        )
        .signers([agent])
        .rpc()

      const task = await program.account.task.fetch(taskPda)
      expect(task.status).to.deep.include({ submitted: {} })
    })

    it('creator approves and settles', async () => {
      const agentBalanceBefore = await provider.connection.getBalance(agent.publicKey)
      const treasuryBalanceBefore = await provider.connection.getBalance(treasury.publicKey)

      await program.methods
        .approveAndSettle()
        .accounts(
          accs({
            task: taskPda,
            platform: platformPda,
            creator: creator.publicKey,
            agent: agent.publicKey,
            agentProfile: agentProfilePda,
            treasury: treasury.publicKey,
          })
        )
        .signers([creator])
        .rpc()

      // Task PDA should be closed (account reclaimed)
      const taskAccountInfo = await provider.connection.getAccountInfo(taskPda)
      expect(taskAccountInfo).to.be.null

      // Verify agent profile updated
      const profile = await program.account.agentProfile.fetch(agentProfilePda)
      expect(profile.tasksCompleted.toNumber()).to.equal(1)
      expect(profile.reputationScore.toNumber()).to.equal(50) // reputation_reward from create_task

      // Verify payouts
      const expectedFee = Math.floor((bounty * FEE_BPS) / 10000)
      const expectedPayout = bounty - expectedFee

      const agentBalanceAfter = await provider.connection.getBalance(agent.publicKey)
      const treasuryBalanceAfter = await provider.connection.getBalance(treasury.publicKey)

      expect(agentBalanceAfter - agentBalanceBefore).to.equal(expectedPayout)
      expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(expectedFee)
    })
  })

  // ─── Cancel flow ───────────────────────────────────────────

  describe('task cancellation', () => {
    let taskPda: PublicKey

    it('creator cancels an open task and gets refund', async () => {
      const taskIndex = new BN(creatorTaskCount)
      const bounty = 0.5 * LAMPORTS_PER_SOL

        ;[taskPda] = PublicKey.findProgramAddressSync(
          [Buffer.from('task'), creator.publicKey.toBuffer(), taskIndex.toArrayLike(Buffer, 'le', 8)],
          program.programId
        )

      const deadline = Math.floor(Date.now() / 1000) + 3600

      await program.methods
        .createTask(
          'Cancellable task',
          Array.from(Buffer.alloc(32, 3)) as any,
          new BN(bounty),
          new BN(creatorTaskCount),
          new BN(deadline),
          new BN(10)
        )
        .accounts(
          accs({
            task: taskPda,
            platform: platformPda,
            creatorCounter: creatorCounterPda,
            creator: creator.publicKey,
            systemProgram: SystemProgram.programId,
          })
        )
        .signers([creator])
        .rpc()

      creatorTaskCount++

      const creatorBefore = await provider.connection.getBalance(creator.publicKey)

      await program.methods
        .cancelTask()
        .accounts(
          accs({
            task: taskPda,
            creator: creator.publicKey,
          })
        )
        .signers([creator])
        .rpc()

      // Task PDA should be closed
      const taskAccountInfo = await provider.connection.getAccountInfo(taskPda)
      expect(taskAccountInfo).to.be.null

      const creatorAfter = await provider.connection.getBalance(creator.publicKey)
      // Creator should receive bounty back (minus tx fees)
      expect(creatorAfter).to.be.greaterThan(creatorBefore)
    })
  })

  // ─── Template flow ─────────────────────────────────────────

  describe('task templates', () => {
    let templatePda: PublicKey

    it('creates a template', async () => {
      const platform = await program.account.platform.fetch(platformPda)
      const templateIndex = platform.templateCount

        ;[templatePda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from('template'),
            creator.publicKey.toBuffer(),
            templateIndex.toArrayLike(Buffer, 'le', 8),
          ],
          program.programId
        )

      await program.methods
        .createTemplate(
          'Literature Review Template',
          Array.from(Buffer.alloc(32, 4)) as any,
          new BN(0.5 * LAMPORTS_PER_SOL),
          { literatureReview: {} } as any
        )
        .accounts(
          accs({
            template: templatePda,
            platform: platformPda,
            creator: creator.publicKey,
            systemProgram: SystemProgram.programId,
          })
        )
        .signers([creator])
        .rpc()

      const template = await program.account.taskTemplate.fetch(templatePda)
      expect(template.title).to.equal('Literature Review Template')
      expect(template.isActive).to.be.true
      expect(template.timesUsed.toNumber()).to.equal(0)
    })

    it('creates a task from template', async () => {
      const taskIndex = new BN(creatorTaskCount)

      const [taskPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('task'), creator.publicKey.toBuffer(), taskIndex.toArrayLike(Buffer, 'le', 8)],
        program.programId
      )

      const deadline = Math.floor(Date.now() / 1000) + 3600

      await program.methods
        .createTaskFromTemplate(
          new BN(0), // use default bounty from template
          new BN(deadline),
          new BN(30),
          new BN(creatorTaskCount)
        )
        .accounts(
          accs({
            task: taskPda,
            template: templatePda,
            platform: platformPda,
            creatorCounter: creatorCounterPda,
            creator: creator.publicKey,
            systemProgram: SystemProgram.programId,
          })
        )
        .signers([creator])
        .rpc()

      creatorTaskCount++

      const task = await program.account.task.fetch(taskPda)
      expect(task.title).to.equal('Literature Review Template')
      expect(task.templateIndex.toNumber()).to.be.greaterThan(0)

      const template = await program.account.taskTemplate.fetch(templatePda)
      expect(template.timesUsed.toNumber()).to.equal(1)
    })
  })

  // ─── Dispute flow ──────────────────────────────────────────

  describe('dispute arbitration', () => {
    let taskPda: PublicKey
    let disputePda: PublicKey

    it('full dispute flow: open → vote → resolve (AgentWins)', async () => {
      // 1. Create & claim & submit
      const taskIndex = new BN(creatorTaskCount)
      const bounty = 2 * LAMPORTS_PER_SOL

        ;[taskPda] = PublicKey.findProgramAddressSync(
          [Buffer.from('task'), creator.publicKey.toBuffer(), taskIndex.toArrayLike(Buffer, 'le', 8)],
          program.programId
        )

      const deadline = Math.floor(Date.now() / 1000) + 3600

      await program.methods
        .createTask(
          'Disputed task',
          Array.from(Buffer.alloc(32, 5)) as any,
          new BN(bounty),
          new BN(creatorTaskCount),
          new BN(deadline),
          new BN(100)
        )
        .accounts(
          accs({
            task: taskPda,
            platform: platformPda,
            creatorCounter: creatorCounterPda,
            creator: creator.publicKey,
            systemProgram: SystemProgram.programId,
          })
        )
        .signers([creator])
        .rpc()

      creatorTaskCount++

      await program.methods
        .claimTask()
        .accounts(
          accs({
            task: taskPda,
            platform: platformPda,
            agentProfile: agentProfilePda,
            agent: agent.publicKey,
          })
        )
        .signers([agent])
        .rpc()

      await program.methods
        .submitDeliverable(Array.from(Buffer.alloc(32, 6)) as any)
        .accounts(
          accs({
            task: taskPda,
            platform: platformPda,
            agent: agent.publicKey,
          })
        )
        .signers([agent])
        .rpc()

      // 2. Creator rejects
      await program.methods
        .rejectSubmission(Array.from(Buffer.alloc(32, 7)) as any)
        .accounts({ task: taskPda, creator: creator.publicKey })
        .signers([creator])
        .rpc()

        // 3. Agent opens dispute
        ;[disputePda] = PublicKey.findProgramAddressSync(
          [Buffer.from('dispute'), taskPda.toBuffer()],
          program.programId
        )

      await program.methods
        .openDispute({ qualityIssue: {} } as any, Array.from(Buffer.alloc(32, 8)) as any)
        .accounts(
          accs({
            task: taskPda,
            dispute: disputePda,
            initiator: agent.publicKey,
            systemProgram: SystemProgram.programId,
          })
        )
        .signers([agent])
        .rpc()

      const dispute = await program.account.dispute.fetch(disputePda)
      expect(dispute.status).to.deep.include({ open: {} })

      // 4. Voters cast votes (2 for agent, 1 for creator)
      for (const [voter, ruling, voterProfile] of [
        [voter1, { agentWins: {} }, voter1ProfilePda],
        [voter2, { agentWins: {} }, voter2ProfilePda],
        [voter3, { creatorWins: {} }, voter3ProfilePda],
      ] as const) {
        const [votePda] = PublicKey.findProgramAddressSync(
          [Buffer.from('vote'), disputePda.toBuffer(), (voter as Keypair).publicKey.toBuffer()],
          program.programId
        )

        await program.methods
          .castVote(ruling as any)
          .accounts(
            accs({
              task: taskPda,
              dispute: disputePda,
              platform: platformPda,
              vote: votePda,
              voterProfile: voterProfile as PublicKey,
              voter: (voter as Keypair).publicKey,
              systemProgram: SystemProgram.programId,
            })
          )
          .signers([voter as Keypair])
          .rpc()
      }

      // 5. Wait for voting period to end
      await new Promise((resolve) => setTimeout(resolve, (VOTING_PERIOD + 1) * 1000))

      // 6. Resolve dispute
      const agentBefore = await provider.connection.getBalance(agent.publicKey)

      await program.methods
        .resolveDispute()
        .accounts(
          accs({
            dispute: disputePda,
            task: taskPda,
            platform: platformPda,
            creator: creator.publicKey,
            agent: agent.publicKey,
            agentProfile: agentProfilePda,
            treasury: treasury.publicKey,
            caller: authority.publicKey,
          })
        )
        .rpc()

      // Both dispute and task PDAs should be closed after resolution
      const disputeInfo = await provider.connection.getAccountInfo(disputePda)
      expect(disputeInfo).to.be.null
      const taskInfo = await provider.connection.getAccountInfo(taskPda)
      expect(taskInfo).to.be.null

      // Verify agent profile updated after dispute
      const profile = await program.account.agentProfile.fetch(agentProfilePda)
      expect(profile.tasksDisputed.toNumber()).to.equal(1)
      expect(profile.disputesWon.toNumber()).to.equal(1)
      expect(profile.reputationScore.toNumber()).to.equal(150) // 50 from approve + 100 from dispute win

      // Agent should have received payout
      const agentAfter = await provider.connection.getBalance(agent.publicKey)
      expect(agentAfter).to.be.greaterThan(agentBefore)
    })
  })

  // ─── Negative tests (error paths) ─────────────────────────

  describe('negative tests', () => {
    const randomUser = Keypair.generate()
    let taskPda: PublicKey
    let taskIndex: typeof BN.prototype

    before(async () => {
      // Transfer to random user from provider wallet
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: provider.wallet.publicKey,
          toPubkey: randomUser.publicKey,
          lamports: 5 * LAMPORTS_PER_SOL,
        })
      )
      await provider.sendAndConfirm(tx)

      // Create a fresh task for negative tests
      taskIndex = new BN(creatorTaskCount)

        ;[taskPda] = PublicKey.findProgramAddressSync(
          [Buffer.from('task'), creator.publicKey.toBuffer(), taskIndex.toArrayLike(Buffer, 'le', 8)],
          program.programId
        )

      const deadline = Math.floor(Date.now() / 1000) + 3600

      await program.methods
        .createTask(
          'Negative test task',
          Array.from(Buffer.alloc(32, 10)) as any,
          new BN(1 * LAMPORTS_PER_SOL),
          new BN(creatorTaskCount),
          new BN(deadline),
          new BN(50)
        )
        .accounts(
          accs({
            task: taskPda,
            platform: platformPda,
            creatorCounter: creatorCounterPda,
            creator: creator.publicKey,
            systemProgram: SystemProgram.programId,
          })
        )
        .signers([creator])
        .rpc()

      creatorTaskCount++
    })

    it('rejects task creation with bounty below minimum', async () => {
      const idx = new BN(creatorTaskCount)
      const [badTaskPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('task'), creator.publicKey.toBuffer(), idx.toArrayLike(Buffer, 'le', 8)],
        program.programId
      )

      try {
        await program.methods
          .createTask(
            'Too cheap',
            Array.from(Buffer.alloc(32, 11)) as any,
            new BN(1), // 1 lamport — below minimum
            new BN(creatorTaskCount),
            new BN(Math.floor(Date.now() / 1000) + 3600),
            new BN(10)
          )
          .accounts(
            accs({
              task: badTaskPda,
              platform: platformPda,
              creatorCounter: creatorCounterPda,
              creator: creator.publicKey,
              systemProgram: SystemProgram.programId,
            })
          )
          .signers([creator])
          .rpc()
        expect.fail('Should have thrown BountyTooLow')
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal('BountyTooLow')
      }
    })

    it('rejects task creation with deadline in the past', async () => {
      const idx = new BN(creatorTaskCount)
      const [badTaskPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('task'), creator.publicKey.toBuffer(), idx.toArrayLike(Buffer, 'le', 8)],
        program.programId
      )

      try {
        await program.methods
          .createTask(
            'Past deadline',
            Array.from(Buffer.alloc(32, 12)) as any,
            new BN(0.1 * LAMPORTS_PER_SOL),
            new BN(creatorTaskCount),
            new BN(1000000), // way in the past
            new BN(10)
          )
          .accounts(
            accs({
              task: badTaskPda,
              platform: platformPda,
              creatorCounter: creatorCounterPda,
              creator: creator.publicKey,
              systemProgram: SystemProgram.programId,
            })
          )
          .signers([creator])
          .rpc()
        expect.fail('Should have thrown DeadlineInPast')
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal('DeadlineInPast')
      }
    })

    it('rejects task creation with title > 64 chars', async () => {
      const idx = new BN(creatorTaskCount)
      const [badTaskPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('task'), creator.publicKey.toBuffer(), idx.toArrayLike(Buffer, 'le', 8)],
        program.programId
      )

      try {
        await program.methods
          .createTask(
            'A'.repeat(65), // too long
            Array.from(Buffer.alloc(32, 13)) as any,
            new BN(0.1 * LAMPORTS_PER_SOL),
            new BN(creatorTaskCount),
            new BN(Math.floor(Date.now() / 1000) + 3600),
            new BN(10)
          )
          .accounts(
            accs({
              task: badTaskPda,
              platform: platformPda,
              creatorCounter: creatorCounterPda,
              creator: creator.publicKey,
              systemProgram: SystemProgram.programId,
            })
          )
          .signers([creator])
          .rpc()
        expect.fail('Should have thrown TitleTooLong')
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal('TitleTooLong')
      }
    })

    it('rejects cancel by non-creator', async () => {
      try {
        await program.methods
          .cancelTask()
          .accounts(
            accs({
              task: taskPda,
              creator: randomUser.publicKey,
            })
          )
          .signers([randomUser])
          .rpc()
        expect.fail('Should have thrown')
      } catch (err: any) {
        // PDA seed constraint will fail since creator doesn't match
        expect(err).to.exist
      }
    })

    it('rejects claim on already-claimed task', async () => {
      // First claim succeeds
      await program.methods
        .claimTask()
        .accounts(
          accs({
            task: taskPda,
            platform: platformPda,
            agentProfile: agentProfilePda,
            agent: agent.publicKey,
          })
        )
        .signers([agent])
        .rpc()

      // Second claim by a voter (who has a profile) should fail
      try {
        await program.methods
          .claimTask()
          .accounts(
            accs({
              task: taskPda,
              platform: platformPda,
              agentProfile: voter1ProfilePda,
              agent: voter1.publicKey,
            })
          )
          .signers([voter1])
          .rpc()
        expect.fail('Should have thrown TaskNotOpen')
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal('TaskNotOpen')
      }
    })

    it('rejects submission by non-assigned agent', async () => {
      try {
        await program.methods
          .submitDeliverable(Array.from(Buffer.alloc(32, 14)) as any)
          .accounts(
            accs({
              task: taskPda,
              platform: platformPda,
              agent: voter1.publicKey,
            })
          )
          .signers([voter1])
          .rpc()
        expect.fail('Should have thrown NotAssignedAgent')
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal('NotAssignedAgent')
      }
    })

    it('rejects approval on non-submitted task', async () => {
      // Task is still in Claimed status
      try {
        await program.methods
          .approveAndSettle()
          .accounts(
            accs({
              task: taskPda,
              platform: platformPda,
              creator: creator.publicKey,
              agent: agent.publicKey,
              agentProfile: agentProfilePda,
              treasury: treasury.publicKey,
            })
          )
          .signers([creator])
          .rpc()
        expect.fail('Should have thrown TaskNotSubmitted')
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal('TaskNotSubmitted')
      }
    })

    it('rejects reject_submission on non-submitted task', async () => {
      try {
        await program.methods
          .rejectSubmission(Array.from(Buffer.alloc(32, 15)) as any)
          .accounts(
            accs({
              task: taskPda,
              creator: creator.publicKey,
            })
          )
          .signers([creator])
          .rpc()
        expect.fail('Should have thrown TaskNotSubmitted')
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal('TaskNotSubmitted')
      }
    })

    it('rejects cancel on claimed task (not open)', async () => {
      try {
        await program.methods
          .cancelTask()
          .accounts(
            accs({
              task: taskPda,
              creator: creator.publicKey,
            })
          )
          .signers([creator])
          .rpc()
        expect.fail('Should have thrown TaskNotOpen')
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal('TaskNotOpen')
      }
    })

    it('rejects expire before deadline', async () => {
      try {
        await program.methods
          .expireTask()
          .accounts(
            accs({
              task: taskPda,
              creator: creator.publicKey,
              platform: platformPda,
              caller: randomUser.publicKey,
            })
          )
          .signers([randomUser])
          .rpc()
        expect.fail('Should have thrown DeadlineNotReached')
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal('DeadlineNotReached')
      }
    })
  })

  // ─── Platform admin negative tests ─────────────────────────

  describe('platform admin negative tests', () => {
    const nonAuthority = Keypair.generate()

    before(async () => {
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: provider.wallet.publicKey,
          toPubkey: nonAuthority.publicKey,
          lamports: 2 * LAMPORTS_PER_SOL,
        })
      )
      await provider.sendAndConfirm(tx)
    })

    it('rejects pause by non-authority', async () => {
      try {
        await program.methods
          .pausePlatform()
          .accounts({
            platform: platformPda,
            authority: nonAuthority.publicKey,
          })
          .signers([nonAuthority])
          .rpc()
        expect.fail('Should have thrown NotPlatformAuthority')
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal('NotPlatformAuthority')
      }
    })

    it('rejects resume when not paused', async () => {
      try {
        await program.methods
          .resumePlatform()
          .accounts({
            platform: platformPda,
            authority: authority.publicKey,
          })
          .rpc()
        expect.fail('Should have thrown PlatformNotPaused')
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal('PlatformNotPaused')
      }
    })

    it('rejects task creation when platform is paused', async () => {
      // Pause the platform
      await program.methods
        .pausePlatform()
        .accounts({
          platform: platformPda,
          authority: authority.publicKey,
        })
        .rpc()

      const platform = await program.account.platform.fetch(platformPda)
      expect(platform.isPaused).to.be.true

      const idx = new BN(creatorTaskCount)
      const [taskPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('task'), creator.publicKey.toBuffer(), idx.toArrayLike(Buffer, 'le', 8)],
        program.programId
      )

      try {
        await program.methods
          .createTask(
            'Paused task',
            Array.from(Buffer.alloc(32, 20)) as any,
            new BN(0.1 * LAMPORTS_PER_SOL),
            new BN(creatorTaskCount),
            new BN(Math.floor(Date.now() / 1000) + 3600),
            new BN(10)
          )
          .accounts(
            accs({
              task: taskPda,
              platform: platformPda,
              creatorCounter: creatorCounterPda,
              creator: creator.publicKey,
              systemProgram: SystemProgram.programId,
            })
          )
          .signers([creator])
          .rpc()
        expect.fail('Should have thrown PlatformPaused')
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal('PlatformPaused')
      }

      // Resume the platform for subsequent tests
      await program.methods
        .resumePlatform()
        .accounts({
          platform: platformPda,
          authority: authority.publicKey,
        })
        .rpc()
    })

    it('rejects double-pause', async () => {
      await program.methods
        .pausePlatform()
        .accounts({
          platform: platformPda,
          authority: authority.publicKey,
        })
        .rpc()

      try {
        await program.methods
          .pausePlatform()
          .accounts({
            platform: platformPda,
            authority: authority.publicKey,
          })
          .rpc()
        expect.fail('Should have thrown PlatformAlreadyPaused')
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal('PlatformAlreadyPaused')
      }

      // Clean up: resume
      await program.methods
        .resumePlatform()
        .accounts({
          platform: platformPda,
          authority: authority.publicKey,
        })
        .rpc()
    })

    it('rejects update_platform with invalid fee (> 50%)', async () => {
      try {
        await program.methods
          .updatePlatform(
            6000, // > 3001 (50%)
            new BN(MIN_BOUNTY),
            new BN(VOTING_PERIOD),
            MIN_VOTES,
            new BN(MIN_VOTER_REPUTATION),
            new BN(CLAIM_GRACE_PERIOD),
            treasury.publicKey
          )
          .accounts({
            platform: platformPda,
            authority: authority.publicKey,
          })
          .rpc()
        expect.fail('Should have thrown InvalidFee')
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal('InvalidFee')
      }
    })
  })

  // ─── Dispute negative tests ────────────────────────────────

  describe('dispute negative tests', () => {
    let taskPda: PublicKey

    before(async () => {
      const taskIndex = new BN(creatorTaskCount)
      const bounty = 0.5 * LAMPORTS_PER_SOL

        ;[taskPda] = PublicKey.findProgramAddressSync(
          [Buffer.from('task'), creator.publicKey.toBuffer(), taskIndex.toArrayLike(Buffer, 'le', 8)],
          program.programId
        )

      const deadline = Math.floor(Date.now() / 1000) + 3600

      await program.methods
        .createTask(
          'Open task for dispute test',
          Array.from(Buffer.alloc(32, 30)) as any,
          new BN(bounty),
          new BN(creatorTaskCount),
          new BN(deadline),
          new BN(10)
        )
        .accounts(
          accs({
            task: taskPda,
            platform: platformPda,
            creatorCounter: creatorCounterPda,
            creator: creator.publicKey,
            systemProgram: SystemProgram.programId,
          })
        )
        .signers([creator])
        .rpc()

      creatorTaskCount++
    })

    it('rejects dispute on non-submitted/rejected task (open)', async () => {
      const [disputePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('dispute'), taskPda.toBuffer()],
        program.programId
      )

      try {
        await program.methods
          .openDispute({ qualityIssue: {} } as any, Array.from(Buffer.alloc(32, 31)) as any)
          .accounts(
            accs({
              task: taskPda,
              dispute: disputePda,
              initiator: creator.publicKey,
              systemProgram: SystemProgram.programId,
            })
          )
          .signers([creator])
          .rpc()
        expect.fail('Should have thrown TaskNotDisputable')
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal('TaskNotDisputable')
      }
    })

    it('rejects dispute by non-party', async () => {
      // Get the task to submitted state
      await program.methods
        .claimTask()
        .accounts(
          accs({
            task: taskPda,
            platform: platformPda,
            agentProfile: agentProfilePda,
            agent: agent.publicKey,
          })
        )
        .signers([agent])
        .rpc()

      await program.methods
        .submitDeliverable(Array.from(Buffer.alloc(32, 32)) as any)
        .accounts(
          accs({
            task: taskPda,
            platform: platformPda,
            agent: agent.publicKey,
          })
        )
        .signers([agent])
        .rpc()

      const [disputePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('dispute'), taskPda.toBuffer()],
        program.programId
      )

      try {
        await program.methods
          .openDispute({ qualityIssue: {} } as any, Array.from(Buffer.alloc(32, 33)) as any)
          .accounts(
            accs({
              task: taskPda,
              dispute: disputePda,
              initiator: voter1.publicKey, // not a party
              systemProgram: SystemProgram.programId,
            })
          )
          .signers([voter1])
          .rpc()
        expect.fail('Should have thrown NotTaskParty')
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal('NotTaskParty')
      }
    })
  })

  // ─── Expire task success ───────────────────────────────────

  describe('expire task (success)', () => {
    let taskPda: PublicKey

    it('expires an open task after deadline passes', async () => {
      const taskIndex = new BN(creatorTaskCount)
      const bounty = 0.2 * LAMPORTS_PER_SOL

        ;[taskPda] = PublicKey.findProgramAddressSync(
          [Buffer.from('task'), creator.publicKey.toBuffer(), taskIndex.toArrayLike(Buffer, 'le', 8)],
          program.programId
        )

      // Very short deadline: 3 seconds from now
      const deadline = Math.floor(Date.now() / 1000) + 3

      await program.methods
        .createTask(
          'Short deadline task',
          Array.from(Buffer.alloc(32, 40)) as any,
          new BN(bounty),
          new BN(creatorTaskCount),
          new BN(deadline),
          new BN(10)
        )
        .accounts(
          accs({
            task: taskPda,
            platform: platformPda,
            creatorCounter: creatorCounterPda,
            creator: creator.publicKey,
            systemProgram: SystemProgram.programId,
          })
        )
        .signers([creator])
        .rpc()

      creatorTaskCount++

      // Wait for deadline to pass
      await new Promise((resolve) => setTimeout(resolve, 5000))

      const creatorBefore = await provider.connection.getBalance(creator.publicKey)

      // Anyone can trigger expiration
      await program.methods
        .expireTask()
        .accounts(
          accs({
            task: taskPda,
            creator: creator.publicKey,
            platform: platformPda,
            caller: authority.publicKey,
          })
        )
        .rpc()

      // Task PDA should be closed
      const taskInfo = await provider.connection.getAccountInfo(taskPda)
      expect(taskInfo).to.be.null

      // Creator should have received bounty + rent back
      const creatorAfter = await provider.connection.getBalance(creator.publicKey)
      expect(creatorAfter).to.be.greaterThan(creatorBefore)
    })
  })

  // ─── MAX_REJECTIONS auto-dispute ───────────────────────────

  describe('auto-dispute after MAX_REJECTIONS (3)', () => {
    let taskPda: PublicKey

    it('auto-transitions to Disputed after 3 rejections', async () => {
      const taskIndex = new BN(creatorTaskCount)
      const bounty = 0.5 * LAMPORTS_PER_SOL

        ;[taskPda] = PublicKey.findProgramAddressSync(
          [Buffer.from('task'), creator.publicKey.toBuffer(), taskIndex.toArrayLike(Buffer, 'le', 8)],
          program.programId
        )

      const deadline = Math.floor(Date.now() / 1000) + 3600

      await program.methods
        .createTask(
          'Multi-reject task',
          Array.from(Buffer.alloc(32, 50)) as any,
          new BN(bounty),
          new BN(creatorTaskCount),
          new BN(deadline),
          new BN(20)
        )
        .accounts(
          accs({
            task: taskPda,
            platform: platformPda,
            creatorCounter: creatorCounterPda,
            creator: creator.publicKey,
            systemProgram: SystemProgram.programId,
          })
        )
        .signers([creator])
        .rpc()

      creatorTaskCount++

      // Agent claims
      await program.methods
        .claimTask()
        .accounts(
          accs({
            task: taskPda,
            platform: platformPda,
            agentProfile: agentProfilePda,
            agent: agent.publicKey,
          })
        )
        .signers([agent])
        .rpc()

      // Rejection cycle: submit → reject × 3
      for (let i = 0; i < 3; i++) {
        // Agent submits
        await program.methods
          .submitDeliverable(Array.from(Buffer.alloc(32, 51 + i)) as any)
          .accounts(
            accs({
              task: taskPda,
              platform: platformPda,
              agent: agent.publicKey,
            })
          )
          .signers([agent])
          .rpc()

        // Creator rejects
        await program.methods
          .rejectSubmission(Array.from(Buffer.alloc(32, 61 + i)) as any)
          .accounts({ task: taskPda, creator: creator.publicKey })
          .signers([creator])
          .rpc()
      }

      // After 3 rejections, status should be Disputed
      const task = await program.account.task.fetch(taskPda)
      expect(task.status).to.deep.include({ disputed: {} })
      expect(task.rejectionCount).to.equal(3)
    })
  })

  // ─── Dispute: CreatorWins & Split rulings ──────────────────

  describe('dispute rulings: CreatorWins and Split', () => {
    // ── CreatorWins ──

    it('resolves dispute with CreatorWins ruling (full refund)', async () => {
      const taskIndex = new BN(creatorTaskCount)
      const bounty = 1 * LAMPORTS_PER_SOL

      const [taskPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('task'), creator.publicKey.toBuffer(), taskIndex.toArrayLike(Buffer, 'le', 8)],
        program.programId
      )

      const deadline = Math.floor(Date.now() / 1000) + 3600

      // Create → Claim → Submit → Reject → OpenDispute
      await program.methods
        .createTask(
          'CreatorWins dispute task',
          Array.from(Buffer.alloc(32, 70)) as any,
          new BN(bounty),
          new BN(creatorTaskCount),
          new BN(deadline),
          new BN(50)
        )
        .accounts(
          accs({
            task: taskPda,
            platform: platformPda,
            creatorCounter: creatorCounterPda,
            creator: creator.publicKey,
            systemProgram: SystemProgram.programId,
          })
        )
        .signers([creator])
        .rpc()

      creatorTaskCount++

      await program.methods
        .claimTask()
        .accounts(
          accs({
            task: taskPda,
            platform: platformPda,
            agentProfile: agentProfilePda,
            agent: agent.publicKey,
          })
        )
        .signers([agent])
        .rpc()

      await program.methods
        .submitDeliverable(Array.from(Buffer.alloc(32, 71)) as any)
        .accounts(
          accs({
            task: taskPda,
            platform: platformPda,
            agent: agent.publicKey,
          })
        )
        .signers([agent])
        .rpc()

      await program.methods
        .rejectSubmission(Array.from(Buffer.alloc(32, 72)) as any)
        .accounts({ task: taskPda, creator: creator.publicKey })
        .signers([creator])
        .rpc()

      const [disputePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('dispute'), taskPda.toBuffer()],
        program.programId
      )

      await program.methods
        .openDispute({ qualityIssue: {} } as any, Array.from(Buffer.alloc(32, 73)) as any)
        .accounts(
          accs({
            task: taskPda,
            dispute: disputePda,
            initiator: creator.publicKey,
            systemProgram: SystemProgram.programId,
          })
        )
        .signers([creator])
        .rpc()

      // Both voters vote CreatorWins
      for (const [voter, voterProfile] of [
        [voter1, voter1ProfilePda],
        [voter2, voter2ProfilePda],
      ] as const) {
        const [votePda] = PublicKey.findProgramAddressSync(
          [Buffer.from('vote'), disputePda.toBuffer(), (voter as Keypair).publicKey.toBuffer()],
          program.programId
        )

        await program.methods
          .castVote({ creatorWins: {} } as any)
          .accounts(
            accs({
              task: taskPda,
              dispute: disputePda,
              platform: platformPda,
              vote: votePda,
              voterProfile: voterProfile as PublicKey,
              voter: (voter as Keypair).publicKey,
              systemProgram: SystemProgram.programId,
            })
          )
          .signers([voter as Keypair])
          .rpc()
      }

      // Wait for voting period
      await new Promise((resolve) => setTimeout(resolve, (VOTING_PERIOD + 1) * 1000))

      const creatorBefore = await provider.connection.getBalance(creator.publicKey)

      await program.methods
        .resolveDispute()
        .accounts(
          accs({
            dispute: disputePda,
            task: taskPda,
            platform: platformPda,
            creator: creator.publicKey,
            agent: agent.publicKey,
            agentProfile: agentProfilePda,
            treasury: treasury.publicKey,
            caller: authority.publicKey,
          })
        )
        .rpc()

      // Both PDAs should be closed
      const taskInfo = await provider.connection.getAccountInfo(taskPda)
      expect(taskInfo).to.be.null
      const disputeInfo = await provider.connection.getAccountInfo(disputePda)
      expect(disputeInfo).to.be.null

      // Creator should receive full bounty back (no fee for CreatorWins)
      const creatorAfter = await provider.connection.getBalance(creator.publicKey)
      expect(creatorAfter - creatorBefore).to.be.greaterThanOrEqual(bounty)
    })

    // ── Split ──

    it('resolves dispute with Split ruling (50/50 minus fee)', async () => {
      const taskIndex = new BN(creatorTaskCount)
      const bounty = 2 * LAMPORTS_PER_SOL

      const [taskPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('task'), creator.publicKey.toBuffer(), taskIndex.toArrayLike(Buffer, 'le', 8)],
        program.programId
      )

      const deadline = Math.floor(Date.now() / 1000) + 3600

      await program.methods
        .createTask(
          'Split dispute task',
          Array.from(Buffer.alloc(32, 80)) as any,
          new BN(bounty),
          new BN(creatorTaskCount),
          new BN(deadline),
          new BN(50)
        )
        .accounts(
          accs({
            task: taskPda,
            platform: platformPda,
            creatorCounter: creatorCounterPda,
            creator: creator.publicKey,
            systemProgram: SystemProgram.programId,
          })
        )
        .signers([creator])
        .rpc()

      creatorTaskCount++

      await program.methods
        .claimTask()
        .accounts(
          accs({
            task: taskPda,
            platform: platformPda,
            agentProfile: agentProfilePda,
            agent: agent.publicKey,
          })
        )
        .signers([agent])
        .rpc()

      await program.methods
        .submitDeliverable(Array.from(Buffer.alloc(32, 81)) as any)
        .accounts(
          accs({
            task: taskPda,
            platform: platformPda,
            agent: agent.publicKey,
          })
        )
        .signers([agent])
        .rpc()

      await program.methods
        .rejectSubmission(Array.from(Buffer.alloc(32, 82)) as any)
        .accounts({ task: taskPda, creator: creator.publicKey })
        .signers([creator])
        .rpc()

      const [disputePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('dispute'), taskPda.toBuffer()],
        program.programId
      )

      await program.methods
        .openDispute({ qualityIssue: {} } as any, Array.from(Buffer.alloc(32, 83)) as any)
        .accounts(
          accs({
            task: taskPda,
            dispute: disputePda,
            initiator: agent.publicKey,
            systemProgram: SystemProgram.programId,
          })
        )
        .signers([agent])
        .rpc()

      // 1 vote CreatorWins + 1 vote AgentWins → tie → Split
      const [vote1Pda] = PublicKey.findProgramAddressSync(
        [Buffer.from('vote'), disputePda.toBuffer(), voter1.publicKey.toBuffer()],
        program.programId
      )
      await program.methods
        .castVote({ creatorWins: {} } as any)
        .accounts(
          accs({
            task: taskPda,
            dispute: disputePda,
            platform: platformPda,
            vote: vote1Pda,
            voterProfile: voter1ProfilePda,
            voter: voter1.publicKey,
            systemProgram: SystemProgram.programId,
          })
        )
        .signers([voter1])
        .rpc()

      const [vote2Pda] = PublicKey.findProgramAddressSync(
        [Buffer.from('vote'), disputePda.toBuffer(), voter2.publicKey.toBuffer()],
        program.programId
      )
      await program.methods
        .castVote({ agentWins: {} } as any)
        .accounts(
          accs({
            task: taskPda,
            dispute: disputePda,
            platform: platformPda,
            vote: vote2Pda,
            voterProfile: voter2ProfilePda,
            voter: voter2.publicKey,
            systemProgram: SystemProgram.programId,
          })
        )
        .signers([voter2])
        .rpc()

      // Wait for voting period
      await new Promise((resolve) => setTimeout(resolve, (VOTING_PERIOD + 1) * 1000))

      const creatorBefore = await provider.connection.getBalance(creator.publicKey)
      const agentBefore = await provider.connection.getBalance(agent.publicKey)
      const treasuryBefore = await provider.connection.getBalance(treasury.publicKey)

      await program.methods
        .resolveDispute()
        .accounts(
          accs({
            dispute: disputePda,
            task: taskPda,
            platform: platformPda,
            creator: creator.publicKey,
            agent: agent.publicKey,
            agentProfile: agentProfilePda,
            treasury: treasury.publicKey,
            caller: authority.publicKey,
          })
        )
        .rpc()

      // Both PDAs should be closed
      const taskInfo = await provider.connection.getAccountInfo(taskPda)
      expect(taskInfo).to.be.null

      // Verify split distribution
      const fee = Math.floor((bounty * FEE_BPS) / 10000)
      const afterFee = bounty - fee
      const halfAgent = Math.floor(afterFee / 2)
      const halfCreator = afterFee - halfAgent // creator gets ceiling

      const creatorAfter = await provider.connection.getBalance(creator.publicKey)
      const agentAfter = await provider.connection.getBalance(agent.publicKey)
      const treasuryAfter = await provider.connection.getBalance(treasury.publicKey)

      // Creator gets half + rent from closed accounts
      expect(creatorAfter - creatorBefore).to.be.greaterThanOrEqual(halfCreator)
      // Agent gets the other half
      expect(agentAfter - agentBefore).to.equal(halfAgent)
      // Treasury gets the fee
      expect(treasuryAfter - treasuryBefore).to.equal(fee)
    })
  })

  // ─── InsufficientVotes error path ──────────────────────────

  describe('InsufficientVotes error path', () => {
    it('rejects resolve_dispute when votes < min_votes', async () => {
      const taskIndex = new BN(creatorTaskCount)
      const bounty = 0.5 * LAMPORTS_PER_SOL

      const [taskPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('task'), creator.publicKey.toBuffer(), taskIndex.toArrayLike(Buffer, 'le', 8)],
        program.programId
      )

      const deadline = Math.floor(Date.now() / 1000) + 3600

      // Create → Claim → Submit → Reject → OpenDispute
      await program.methods
        .createTask(
          'InsufficientVotes task',
          Array.from(Buffer.alloc(32, 90)) as any,
          new BN(bounty),
          new BN(creatorTaskCount),
          new BN(deadline),
          new BN(10)
        )
        .accounts(
          accs({
            task: taskPda,
            platform: platformPda,
            creatorCounter: creatorCounterPda,
            creator: creator.publicKey,
            systemProgram: SystemProgram.programId,
          })
        )
        .signers([creator])
        .rpc()

      creatorTaskCount++

      await program.methods
        .claimTask()
        .accounts(
          accs({
            task: taskPda,
            platform: platformPda,
            agentProfile: agentProfilePda,
            agent: agent.publicKey,
          })
        )
        .signers([agent])
        .rpc()

      await program.methods
        .submitDeliverable(Array.from(Buffer.alloc(32, 91)) as any)
        .accounts(
          accs({
            task: taskPda,
            platform: platformPda,
            agent: agent.publicKey,
          })
        )
        .signers([agent])
        .rpc()

      await program.methods
        .rejectSubmission(Array.from(Buffer.alloc(32, 92)) as any)
        .accounts({ task: taskPda, creator: creator.publicKey })
        .signers([creator])
        .rpc()

      const [disputePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('dispute'), taskPda.toBuffer()],
        program.programId
      )

      await program.methods
        .openDispute({ qualityIssue: {} } as any, Array.from(Buffer.alloc(32, 93)) as any)
        .accounts(
          accs({
            task: taskPda,
            dispute: disputePda,
            initiator: agent.publicKey,
            systemProgram: SystemProgram.programId,
          })
        )
        .signers([agent])
        .rpc()

      // Cast only 1 vote (MIN_VOTES = 2)
      const [votePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('vote'), disputePda.toBuffer(), voter1.publicKey.toBuffer()],
        program.programId
      )

      await program.methods
        .castVote({ agentWins: {} } as any)
        .accounts(
          accs({
            task: taskPda,
            dispute: disputePda,
            platform: platformPda,
            vote: votePda,
            voterProfile: voter1ProfilePda,
            voter: voter1.publicKey,
            systemProgram: SystemProgram.programId,
          })
        )
        .signers([voter1])
        .rpc()

      // Wait for voting period to end
      await new Promise((resolve) => setTimeout(resolve, (VOTING_PERIOD + 1) * 1000))

      // Try to resolve — should fail with InsufficientVotes
      try {
        await program.methods
          .resolveDispute()
          .accounts(
            accs({
              dispute: disputePda,
              task: taskPda,
              platform: platformPda,
              creator: creator.publicKey,
              agent: agent.publicKey,
              agentProfile: agentProfilePda,
              treasury: treasury.publicKey,
              caller: authority.publicKey,
            })
          )
          .rpc()
        expect.fail('Should have thrown InsufficientVotes')
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal('InsufficientVotes')
      }
    })
  })
})
