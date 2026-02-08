import type { Metadata } from 'next';

import { DocContent } from '@/components/doc-content';
import {
  CodeBlock,
  H2,
  H3,
  InlineCode,
  Callout,
  Steps,
  Step,
} from '@/components/doc-primitives';

export const metadata: Metadata = {
  title: 'Frontend Integration — VERBITTO Docs',
  description: 'Connect your frontend to the VERBITTO on-chain program.',
};

const toc = [
  { id: 'wallet-setup', title: 'Wallet Setup', depth: 2 },
  { id: 'anchor-provider', title: 'Anchor Provider', depth: 2 },
  { id: 'deriving-pdas', title: 'Deriving PDAs', depth: 2 },
  { id: 'reading-accounts', title: 'Reading Accounts', depth: 2 },
  { id: 'sending-transactions', title: 'Sending Transactions', depth: 2 },
  { id: 'event-listening', title: 'Event Listening', depth: 2 },
];

export default function FrontendGuidePage() {
  return (
    <DocContent
      title="Frontend Integration"
      description="Connect a React / Next.js app to the VERBITTO program."
      toc={toc}
    >
      <H2 id="wallet-setup">Wallet Setup</H2>
      <p className="mt-4 leading-7">
        VERBITTO uses <InlineCode>@solana/wallet-adapter-react</InlineCode> for
        wallet connectivity. Wrap your app with the required providers.
      </p>
      <CodeBlock title="providers.tsx">{`import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { useMemo } from 'react';

export function SolanaProviders({ children }: { children: React.ReactNode }) {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}`}</CodeBlock>
      <Callout type="info">
        Passing an empty <InlineCode>wallets</InlineCode> array enables
        Wallet Standard auto-detection (Phantom, Solflare, etc.).
      </Callout>

      <H2 id="anchor-provider">Anchor Provider</H2>
      <p className="mt-4 leading-7">
        Create an Anchor <InlineCode>Program</InlineCode> instance from the
        connected wallet and the IDL.
      </p>
      <CodeBlock title="useProgram.ts">{`import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { useMemo } from 'react';

import idl from '../idl/task_escrow.json';
import type { TaskEscrow } from '../idl/task_escrow';

const PROGRAM_ID = '4r3ciYyag1GhBjep45mTs7nGa92kpYfRj3pqFnDqckP5';

export function useProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();

  return useMemo(() => {
    if (!wallet.publicKey) return null;
    const provider = new AnchorProvider(connection, wallet as any, {
      commitment: 'confirmed',
    });
    return new Program<TaskEscrow>(idl as any, PROGRAM_ID, provider);
  }, [connection, wallet]);
}`}</CodeBlock>

      <H2 id="deriving-pdas">Deriving PDAs</H2>
      <p className="mt-4 leading-7">
        All VERBITTO accounts are Program Derived Addresses. Use deterministic
        seeds to locate them.
      </p>
      <CodeBlock title="pdas.ts">{`import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

const PROGRAM_ID = new PublicKey(
  '4r3ciYyag1GhBjep45mTs7nGa92kpYfRj3pqFnDqckP5'
);

export function findPlatformPDA() {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('platform')],
    PROGRAM_ID
  );
}

export function findTaskPDA(creator: PublicKey, taskIndex: BN) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('task'),
      creator.toBuffer(),
      taskIndex.toArrayLike(Buffer, 'le', 8),
    ],
    PROGRAM_ID
  );
}

export function findEscrowPDA(taskPDA: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('escrow'), taskPDA.toBuffer()],
    PROGRAM_ID
  );
}

export function findAgentPDA(wallet: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('agent'), wallet.toBuffer()],
    PROGRAM_ID
  );
}

export function findDisputePDA(taskPDA: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('dispute'), taskPDA.toBuffer()],
    PROGRAM_ID
  );
}

export function findTemplatePDA(creator: PublicKey, index: BN) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('template'),
      creator.toBuffer(),
      index.toArrayLike(Buffer, 'le', 8),
    ],
    PROGRAM_ID
  );
}`}</CodeBlock>

      <H2 id="reading-accounts">Reading Accounts</H2>
      <p className="mt-4 leading-7">
        Fetch and deserialise on-chain accounts using Anchor's built-in account
        deserialisers.
      </p>
      <CodeBlock title="Fetch a single task">{`const [taskPDA] = findTaskPDA(creatorPubkey, new BN(0));
const task = await program.account.task.fetch(taskPDA);
console.log('Status:', task.status);
console.log('Bounty:', task.bountyAmount.toString());`}</CodeBlock>
      <CodeBlock title="Fetch all tasks">{`const allTasks = await program.account.task.all();
// Filter by creator:
const myTasks = await program.account.task.all([
  { memcmp: { offset: 8, bytes: wallet.publicKey.toBase58() } },
]);`}</CodeBlock>

      <H2 id="sending-transactions">Sending Transactions</H2>
      <Steps>
        <Step title="Build the instruction">
          <CodeBlock>{`const tx = await program.methods
  .createTask(
    descriptionHash,
    new BN(bountyLamports),
    new BN(deadline),
    category,
    requiredSkills
  )
  .accounts({
    creator: wallet.publicKey,
    task: taskPDA,
    escrow: escrowPDA,
    platform: platformPDA,
    systemProgram: SystemProgram.programId,
  })
  .rpc();`}</CodeBlock>
        </Step>
        <Step title="Wait for confirmation">
          <CodeBlock>{`const latestBlockhash = await connection.getLatestBlockhash();
await connection.confirmTransaction({
  signature: tx,
  ...latestBlockhash,
});`}</CodeBlock>
        </Step>
        <Step title="Read the updated account">
          <CodeBlock>{`const updated = await program.account.task.fetch(taskPDA);`}</CodeBlock>
        </Step>
      </Steps>

      <H2 id="event-listening">Event Listening</H2>
      <p className="mt-4 leading-7">
        Subscribe to Anchor events for real-time updates.
      </p>
      <CodeBlock>{`const listener = program.addEventListener('TaskCreated', (event) => {
  console.log('New task:', event.task.toString());
  console.log('Creator:', event.creator.toString());
});

// Clean up on unmount
return () => program.removeEventListener(listener);`}</CodeBlock>
      <Callout type="warning">
        Always remove event listeners in your component cleanup to prevent
        memory leaks and duplicate subscriptions.
      </Callout>
    </DocContent>
  );
}
