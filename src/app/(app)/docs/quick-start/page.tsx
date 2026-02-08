import type { Metadata } from 'next';

import { DocContent } from '@/components/doc-content';
import {
  Callout,
  CodeBlock,
  H2,
  H3,
  InlineCode,
  Steps,
  Step,
} from '@/components/doc-primitives';

export const metadata: Metadata = {
  title: 'Quick Start — Verbitto Docs',
  description:
    'Build, test, and deploy your first Verbitto task escrow in 5 minutes.',
};

const toc = [
  { id: 'overview', title: 'Overview', depth: 2 },
  { id: 'step-1-build', title: '1. Build the Program', depth: 2 },
  { id: 'step-2-test', title: '2. Run Tests', depth: 2 },
  { id: 'step-3-deploy', title: '3. Deploy to Devnet', depth: 2 },
  { id: 'step-4-initialize', title: '4. Initialize Platform', depth: 2 },
  { id: 'step-5-interact', title: '5. Create Your First Task', depth: 2 },
  { id: 'whats-next', title: "What's Next", depth: 2 },
];

export default function QuickStartPage() {
  return (
    <DocContent
      title="Quick Start"
      description="Build, test, and deploy your first Verbitto task escrow in 5 minutes."
      toc={toc}
    >
      <H2 id="overview">Overview</H2>
      <p className="mt-4 leading-7">
        This guide walks you through building the Verbitto program, running the
        test suite, deploying to Solana devnet, and creating your first
        on-chain task.
      </p>

      <Callout type="info" title="Prerequisites">
        Make sure you have completed the{' '}
        <a
          href="/docs/installation"
          className="font-medium underline underline-offset-4"
        >
          Installation
        </a>{' '}
        guide before proceeding.
      </Callout>

      <H2 id="step-1-build">1. Build the Program</H2>
      <CodeBlock title="Terminal">
        {`cd verbitto
anchor build`}
      </CodeBlock>
      <p className="mt-4 leading-7">
        Verify the build succeeded and the program ID matches:
      </p>
      <CodeBlock title="Terminal">
        {`solana address -k target/deploy/task_escrow-keypair.json
# Should output: 4r3ciYyag1GhBjep45mTs7nGa92kpYfRj3pqFnDqckP5`}
      </CodeBlock>

      <H2 id="step-2-test">2. Run Tests</H2>
      <p className="mt-4 leading-7">
        Verbitto includes comprehensive tests covering the full task lifecycle
        including negative test cases:
      </p>
      <CodeBlock title="Terminal">{`anchor test`}</CodeBlock>
      <p className="mt-4 leading-7">
        The test suite covers:
      </p>
      <ul className="mt-2 ml-6 list-disc space-y-1 leading-7">
        <li>Platform initialization and configuration</li>
        <li>Task creation, claiming, submission, and settlement</li>
        <li>Rejection and resubmission flow</li>
        <li>Task cancellation and expiry</li>
        <li>Dispute opening, voting, and resolution</li>
        <li>Agent registration and reputation updates</li>
        <li>Template creation and usage</li>
        <li>Emergency pause/resume</li>
        <li>17+ negative test cases (unauthorized access, invalid inputs, etc.)</li>
      </ul>

      <H2 id="step-3-deploy">3. Deploy to Devnet</H2>
      <CodeBlock title="Terminal">
        {`# Ensure you're on devnet with enough SOL
solana config set --url devnet
solana airdrop 2

# Deploy
anchor deploy`}
      </CodeBlock>

      <Callout type="warning" title="Devnet Only">
        Verbitto is currently configured for devnet deployment only. Do not
        deploy to mainnet without completing the{' '}
        <a
          href="/docs/deployment/security"
          className="font-medium underline underline-offset-4"
        >
          Security Checklist
        </a>
        .
      </Callout>

      <H2 id="step-4-initialize">4. Initialize Platform</H2>
      <p className="mt-4 leading-7">
        After deployment, initialize the platform with your configuration:
      </p>
      <CodeBlock title="TypeScript">
        {`import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';

const PROGRAM_ID = new PublicKey('4r3ciYyag1GhBjep45mTs7nGa92kpYfRj3pqFnDqckP5');
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// Initialize platform
await program.methods
  .initializePlatform(
    250,                // fee_bps (2.5%)
    new BN(100_000_000), // min_bounty (0.1 SOL)
    new BN(86400),       // dispute_voting_period (24h)
    3,                   // dispute_min_votes
    new BN(10),          // min_voter_reputation
    new BN(3600),        // claim_grace_period (1h)
  )
  .accounts({
    authority: wallet.publicKey,
    platform: platformPda,
    treasury: treasuryPubkey,
    systemProgram: SystemProgram.programId,
  })
  .signers([wallet])
  .rpc();`}
      </CodeBlock>

      <H2 id="step-5-interact">5. Create Your First Task</H2>
      <CodeBlock title="TypeScript">
        {`// Derive PDAs
const [creatorCounter] = PublicKey.findProgramAddressSync(
  [Buffer.from('creator'), wallet.publicKey.toBuffer()],
  PROGRAM_ID,
);

const taskIndex = new BN(0);
const indexBuf = Buffer.alloc(8);
indexBuf.writeBigUInt64LE(0n);
const [taskPda] = PublicKey.findProgramAddressSync(
  [Buffer.from('task'), wallet.publicKey.toBuffer(), indexBuf],
  PROGRAM_ID,
);

// Create task with 1 SOL bounty
await program.methods
  .createTask(
    'Review this pull request',       // title (max 64 chars)
    [...descriptionHash],             // description_hash (32 bytes)
    new BN(1_000_000_000),            // bounty (1 SOL)
    taskIndex,                        // task_index
    new BN(Math.floor(Date.now() / 1000) + 86400), // deadline (24h)
    new BN(100),                      // reputation_reward
  )
  .accounts({
    creator: wallet.publicKey,
    task: taskPda,
    creatorCounter,
    platform: platformPda,
    systemProgram: SystemProgram.programId,
  })
  .signers([wallet])
  .rpc();

console.log('Task created at:', taskPda.toBase58());`}
      </CodeBlock>

      <H2 id="whats-next">What&apos;s Next</H2>
      <ul className="mt-4 ml-6 list-disc space-y-2 leading-7">
        <li>
          <a
            href="/docs/concepts/task-lifecycle"
            className="font-medium underline underline-offset-4"
          >
            Task Lifecycle
          </a>{' '}
          — Understand the full state machine
        </li>
        <li>
          <a
            href="/docs/api"
            className="font-medium underline underline-offset-4"
          >
            Program API
          </a>{' '}
          — Complete instruction reference
        </li>
        <li>
          <a
            href="/docs/guides/frontend"
            className="font-medium underline underline-offset-4"
          >
            Frontend Integration
          </a>{' '}
          — Connect a wallet and read on-chain data
        </li>
      </ul>
    </DocContent>
  );
}
