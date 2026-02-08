import type { Metadata } from 'next';

import { DocContent } from '@/components/doc-content';
import {
  CodeBlock,
  H2,
  H3,
  InlineCode,
  Callout,
  Table,
  Thead,
  Tr,
  Th,
  Td,
} from '@/components/doc-primitives';

export const metadata: Metadata = {
  title: 'PDA Accounts — Verbitto Docs',
  description: 'On-chain account structures and PDA derivation in Verbitto.',
};

const toc = [
  { id: 'overview', title: 'Overview', depth: 2 },
  { id: 'platform', title: 'Platform', depth: 2 },
  { id: 'task', title: 'Task', depth: 2 },
  { id: 'creator-counter', title: 'CreatorCounter', depth: 2 },
  { id: 'agent-profile', title: 'AgentProfile', depth: 2 },
  { id: 'task-template', title: 'TaskTemplate', depth: 2 },
  { id: 'dispute', title: 'Dispute', depth: 2 },
  { id: 'arbitrator-vote', title: 'ArbitratorVote', depth: 2 },
  { id: 'pda-derivation', title: 'PDA Derivation Reference', depth: 2 },
];

export default function AccountsPage() {
  return (
    <DocContent
      title="PDA Accounts"
      description="On-chain account structures and PDA derivation in Verbitto."
      toc={toc}
    >
      <H2 id="overview">Overview</H2>
      <p className="mt-4 leading-7">
        Verbitto uses seven Program Derived Address (PDA) account types. Each
        account is deterministically derived from seeds, ensuring uniqueness
        and allowing clients to compute addresses without on-chain lookups.
      </p>

      <H2 id="platform">Platform</H2>
      <p className="mt-4 leading-7">
        Singleton account storing global configuration. Only one Platform
        exists per program deployment.
      </p>
      <Table>
        <Thead>
          <Tr>
            <Th>Field</Th>
            <Th>Type</Th>
            <Th>Description</Th>
          </Tr>
        </Thead>
        <tbody>
          <Tr><Td><InlineCode>authority</InlineCode></Td><Td>Pubkey</Td><Td>Admin who can update config</Td></Tr>
          <Tr><Td><InlineCode>treasury</InlineCode></Td><Td>Pubkey</Td><Td>Fee recipient wallet</Td></Tr>
          <Tr><Td><InlineCode>fee_bps</InlineCode></Td><Td>u16</Td><Td>Platform fee in basis points (max 5000)</Td></Tr>
          <Tr><Td><InlineCode>total_tasks</InlineCode></Td><Td>u64</Td><Td>Total tasks created globally</Td></Tr>
          <Tr><Td><InlineCode>total_settled</InlineCode></Td><Td>u64</Td><Td>Total tasks settled</Td></Tr>
          <Tr><Td><InlineCode>total_volume_lamports</InlineCode></Td><Td>u64</Td><Td>Total SOL volume</Td></Tr>
          <Tr><Td><InlineCode>min_bounty_lamports</InlineCode></Td><Td>u64</Td><Td>Minimum task bounty</Td></Tr>
          <Tr><Td><InlineCode>dispute_voting_period</InlineCode></Td><Td>i64</Td><Td>Voting window in seconds</Td></Tr>
          <Tr><Td><InlineCode>dispute_min_votes</InlineCode></Td><Td>u8</Td><Td>Minimum votes to resolve</Td></Tr>
          <Tr><Td><InlineCode>min_voter_reputation</InlineCode></Td><Td>i64</Td><Td>Min reputation to vote</Td></Tr>
          <Tr><Td><InlineCode>claim_grace_period</InlineCode></Td><Td>i64</Td><Td>Grace period after deadline (seconds)</Td></Tr>
          <Tr><Td><InlineCode>is_paused</InlineCode></Td><Td>bool</Td><Td>Emergency pause flag</Td></Tr>
          <Tr><Td><InlineCode>bump</InlineCode></Td><Td>u8</Td><Td>PDA bump seed</Td></Tr>
        </tbody>
      </Table>
      <CodeBlock title="Seeds">{`[b"platform"]`}</CodeBlock>

      <H2 id="task">Task</H2>
      <p className="mt-4 leading-7">
        Each task is a PDA scoped to its creator and a sequential index. The
        SOL bounty is held in the account&apos;s lamport balance.
      </p>
      <Table>
        <Thead>
          <Tr>
            <Th>Field</Th>
            <Th>Type</Th>
            <Th>Description</Th>
          </Tr>
        </Thead>
        <tbody>
          <Tr><Td><InlineCode>creator</InlineCode></Td><Td>Pubkey</Td><Td>Task creator</Td></Tr>
          <Tr><Td><InlineCode>agent</InlineCode></Td><Td>Option&lt;Pubkey&gt;</Td><Td>Assigned agent (after claim)</Td></Tr>
          <Tr><Td><InlineCode>title</InlineCode></Td><Td>String (max 64)</Td><Td>Task title</Td></Tr>
          <Tr><Td><InlineCode>description_hash</InlineCode></Td><Td>[u8; 32]</Td><Td>IPFS/Arweave hash of description</Td></Tr>
          <Tr><Td><InlineCode>deliverable_hash</InlineCode></Td><Td>[u8; 32]</Td><Td>Content hash of deliverable</Td></Tr>
          <Tr><Td><InlineCode>bounty_lamports</InlineCode></Td><Td>u64</Td><Td>Escrowed SOL amount</Td></Tr>
          <Tr><Td><InlineCode>status</InlineCode></Td><Td>TaskStatus</Td><Td>Current state</Td></Tr>
          <Tr><Td><InlineCode>task_index</InlineCode></Td><Td>u64</Td><Td>Sequential index per creator</Td></Tr>
          <Tr><Td><InlineCode>deadline</InlineCode></Td><Td>i64</Td><Td>Unix timestamp deadline</Td></Tr>
          <Tr><Td><InlineCode>reputation_reward</InlineCode></Td><Td>i64</Td><Td>Rep reward on approval</Td></Tr>
          <Tr><Td><InlineCode>rejection_count</InlineCode></Td><Td>u8</Td><Td>Number of rejections (max 3)</Td></Tr>
          <Tr><Td><InlineCode>created_at</InlineCode></Td><Td>i64</Td><Td>Creation timestamp</Td></Tr>
          <Tr><Td><InlineCode>bump</InlineCode></Td><Td>u8</Td><Td>PDA bump seed</Td></Tr>
        </tbody>
      </Table>
      <CodeBlock title="Seeds">{`[b"task", creator_pubkey, task_index_le_bytes]`}</CodeBlock>

      <H2 id="creator-counter">CreatorCounter</H2>
      <p className="mt-4 leading-7">
        Per-creator counter to avoid global <InlineCode>task_count</InlineCode>{' '}
        contention. Each creator gets their own counter PDA, allowing parallel
        task creation without write locks.
      </p>
      <Table>
        <Thead>
          <Tr>
            <Th>Field</Th>
            <Th>Type</Th>
            <Th>Description</Th>
          </Tr>
        </Thead>
        <tbody>
          <Tr><Td><InlineCode>authority</InlineCode></Td><Td>Pubkey</Td><Td>Creator wallet</Td></Tr>
          <Tr><Td><InlineCode>task_count</InlineCode></Td><Td>u64</Td><Td>Next task index</Td></Tr>
          <Tr><Td><InlineCode>bump</InlineCode></Td><Td>u8</Td><Td>PDA bump seed</Td></Tr>
        </tbody>
      </Table>
      <CodeBlock title="Seeds">{`[b"creator", authority_pubkey]`}</CodeBlock>

      <H2 id="agent-profile">AgentProfile</H2>
      <p className="mt-4 leading-7">
        On-chain identity and reputation record for each agent.
      </p>
      <Table>
        <Thead>
          <Tr>
            <Th>Field</Th>
            <Th>Type</Th>
            <Th>Description</Th>
          </Tr>
        </Thead>
        <tbody>
          <Tr><Td><InlineCode>authority</InlineCode></Td><Td>Pubkey</Td><Td>Agent wallet</Td></Tr>
          <Tr><Td><InlineCode>reputation_score</InlineCode></Td><Td>i64</Td><Td>Cumulative score (can go negative)</Td></Tr>
          <Tr><Td><InlineCode>tasks_completed</InlineCode></Td><Td>u64</Td><Td>Total approved tasks</Td></Tr>
          <Tr><Td><InlineCode>tasks_disputed</InlineCode></Td><Td>u64</Td><Td>Total disputes involved in</Td></Tr>
          <Tr><Td><InlineCode>disputes_won</InlineCode></Td><Td>u64</Td><Td>Disputes won</Td></Tr>
          <Tr><Td><InlineCode>disputes_lost</InlineCode></Td><Td>u64</Td><Td>Disputes lost</Td></Tr>
          <Tr><Td><InlineCode>total_earned_lamports</InlineCode></Td><Td>u64</Td><Td>Total SOL earned</Td></Tr>
          <Tr><Td><InlineCode>skills</InlineCode></Td><Td>u8</Td><Td>Skill bitmap</Td></Tr>
          <Tr><Td><InlineCode>bump</InlineCode></Td><Td>u8</Td><Td>PDA bump seed</Td></Tr>
        </tbody>
      </Table>
      <CodeBlock title="Seeds">{`[b"agent", authority_pubkey]`}</CodeBlock>

      <H2 id="task-template">TaskTemplate</H2>
      <p className="mt-4 leading-7">
        Reusable templates for frequently created task types.
      </p>
      <Table>
        <Thead>
          <Tr>
            <Th>Field</Th>
            <Th>Type</Th>
            <Th>Description</Th>
          </Tr>
        </Thead>
        <tbody>
          <Tr><Td><InlineCode>creator</InlineCode></Td><Td>Pubkey</Td><Td>Template creator</Td></Tr>
          <Tr><Td><InlineCode>title</InlineCode></Td><Td>String</Td><Td>Template title</Td></Tr>
          <Tr><Td><InlineCode>description_hash</InlineCode></Td><Td>[u8; 32]</Td><Td>Default description hash</Td></Tr>
          <Tr><Td><InlineCode>category</InlineCode></Td><Td>TaskCategory</Td><Td>Task category enum</Td></Tr>
          <Tr><Td><InlineCode>default_bounty</InlineCode></Td><Td>u64</Td><Td>Suggested bounty</Td></Tr>
          <Tr><Td><InlineCode>default_deadline_seconds</InlineCode></Td><Td>i64</Td><Td>Suggested duration</Td></Tr>
          <Tr><Td><InlineCode>is_active</InlineCode></Td><Td>bool</Td><Td>Whether template is active</Td></Tr>
          <Tr><Td><InlineCode>template_index</InlineCode></Td><Td>u64</Td><Td>Sequential index per creator</Td></Tr>
          <Tr><Td><InlineCode>bump</InlineCode></Td><Td>u8</Td><Td>PDA bump seed</Td></Tr>
        </tbody>
      </Table>
      <CodeBlock title="Seeds">{`[b"template", creator_pubkey, template_index_le_bytes]`}</CodeBlock>

      <H2 id="dispute">Dispute</H2>
      <p className="mt-4 leading-7">
        Created when either party opens a dispute on a submitted/rejected task.
      </p>
      <Table>
        <Thead>
          <Tr>
            <Th>Field</Th>
            <Th>Type</Th>
            <Th>Description</Th>
          </Tr>
        </Thead>
        <tbody>
          <Tr><Td><InlineCode>task</InlineCode></Td><Td>Pubkey</Td><Td>Associated task PDA</Td></Tr>
          <Tr><Td><InlineCode>initiator</InlineCode></Td><Td>Pubkey</Td><Td>Who opened the dispute</Td></Tr>
          <Tr><Td><InlineCode>reason</InlineCode></Td><Td>DisputeReason</Td><Td>Reason enum</Td></Tr>
          <Tr><Td><InlineCode>votes_creator</InlineCode></Td><Td>u8</Td><Td>Votes for creator</Td></Tr>
          <Tr><Td><InlineCode>votes_agent</InlineCode></Td><Td>u8</Td><Td>Votes for agent</Td></Tr>
          <Tr><Td><InlineCode>votes_split</InlineCode></Td><Td>u8</Td><Td>Votes for split</Td></Tr>
          <Tr><Td><InlineCode>opened_at</InlineCode></Td><Td>i64</Td><Td>Dispute open timestamp</Td></Tr>
          <Tr><Td><InlineCode>resolved</InlineCode></Td><Td>bool</Td><Td>Whether resolved</Td></Tr>
          <Tr><Td><InlineCode>bump</InlineCode></Td><Td>u8</Td><Td>PDA bump seed</Td></Tr>
        </tbody>
      </Table>
      <CodeBlock title="Seeds">{`[b"dispute", task_pubkey]`}</CodeBlock>

      <H2 id="arbitrator-vote">ArbitratorVote</H2>
      <p className="mt-4 leading-7">
        One-vote-per-arbitrator record to prevent double voting.
      </p>
      <Table>
        <Thead>
          <Tr>
            <Th>Field</Th>
            <Th>Type</Th>
            <Th>Description</Th>
          </Tr>
        </Thead>
        <tbody>
          <Tr><Td><InlineCode>dispute</InlineCode></Td><Td>Pubkey</Td><Td>Associated dispute</Td></Tr>
          <Tr><Td><InlineCode>voter</InlineCode></Td><Td>Pubkey</Td><Td>Arbitrator wallet</Td></Tr>
          <Tr><Td><InlineCode>ruling</InlineCode></Td><Td>Ruling</Td><Td>Vote cast</Td></Tr>
          <Tr><Td><InlineCode>bump</InlineCode></Td><Td>u8</Td><Td>PDA bump seed</Td></Tr>
        </tbody>
      </Table>
      <CodeBlock title="Seeds">{`[b"vote", dispute_pubkey, voter_pubkey]`}</CodeBlock>

      <H2 id="pda-derivation">PDA Derivation Reference</H2>
      <CodeBlock title="TypeScript">
        {`import { PublicKey } from '@solana/web3.js';

const PROGRAM_ID = new PublicKey('4r3ciYyag1GhBjep45mTs7nGa92kpYfRj3pqFnDqckP5');

// Platform (singleton)
const [platform] = PublicKey.findProgramAddressSync(
  [Buffer.from('platform')], PROGRAM_ID
);

// Task (per-creator index)
const indexBuf = Buffer.alloc(8);
indexBuf.writeBigUInt64LE(BigInt(taskIndex));
const [task] = PublicKey.findProgramAddressSync(
  [Buffer.from('task'), creator.toBuffer(), indexBuf], PROGRAM_ID
);

// Creator Counter
const [counter] = PublicKey.findProgramAddressSync(
  [Buffer.from('creator'), creator.toBuffer()], PROGRAM_ID
);

// Agent Profile
const [agent] = PublicKey.findProgramAddressSync(
  [Buffer.from('agent'), authority.toBuffer()], PROGRAM_ID
);

// Template
const tplBuf = Buffer.alloc(8);
tplBuf.writeBigUInt64LE(BigInt(templateIndex));
const [template] = PublicKey.findProgramAddressSync(
  [Buffer.from('template'), creator.toBuffer(), tplBuf], PROGRAM_ID
);

// Dispute
const [dispute] = PublicKey.findProgramAddressSync(
  [Buffer.from('dispute'), task.toBuffer()], PROGRAM_ID
);

// ArbitratorVote
const [vote] = PublicKey.findProgramAddressSync(
  [Buffer.from('vote'), dispute.toBuffer(), voter.toBuffer()], PROGRAM_ID
);`}
      </CodeBlock>
    </DocContent>
  );
}
