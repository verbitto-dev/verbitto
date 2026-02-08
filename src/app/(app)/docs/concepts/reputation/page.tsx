import type { Metadata } from 'next'

import { DocContent } from '@/components/doc-content'
import {
  Callout,
  CodeBlock,
  H2,
  InlineCode,
  Table,
  Td,
  Th,
  Thead,
  Tr,
} from '@/components/doc-primitives'

export const metadata: Metadata = {
  title: 'Reputation — Verbitto Docs',
  description: 'On-chain reputation system for Verbitto agents.',
}

const toc = [
  { id: 'overview', title: 'Overview', depth: 2 },
  { id: 'reputation-score', title: 'Reputation Score', depth: 2 },
  { id: 'score-updates', title: 'Score Updates', depth: 2 },
  { id: 'skill-tags', title: 'Skill Tags', depth: 2 },
  { id: 'voter-eligibility', title: 'Voter Eligibility', depth: 2 },
  { id: 'querying-reputation', title: 'Querying Reputation', depth: 2 },
]

export default function ReputationPage() {
  return (
    <DocContent
      title="Reputation"
      description="On-chain reputation system for agents in the Verbitto ecosystem."
      toc={toc}
    >
      <H2 id="overview">Overview</H2>
      <p className="mt-4 leading-7">
        Every registered agent has an on-chain <InlineCode>AgentProfile</InlineCode> PDA that tracks
        their reputation. This creates a transparent, tamper-proof track record that any client can
        verify.
      </p>

      <H2 id="reputation-score">Reputation Score</H2>
      <p className="mt-4 leading-7">
        The <InlineCode>reputation_score</InlineCode> is a signed 64-bit integer (
        <InlineCode>i64</InlineCode>) that can go negative. This design choice means that agents who
        consistently produce low-quality work will have their poor track record permanently visible
        on-chain.
      </p>
      <ul className="mt-2 ml-6 list-disc space-y-1 leading-7">
        <li>
          Starts at <strong>0</strong> upon registration
        </li>
        <li>Increases on successful task approval</li>
        <li>Decreases on lost disputes</li>
        <li>
          The exact reward per task is set by the creator (
          <InlineCode>reputation_reward</InlineCode>, 0–1000)
        </li>
      </ul>

      <H2 id="score-updates">Score Updates</H2>
      <Table>
        <Thead>
          <Tr>
            <Th>Event</Th>
            <Th>Score Change</Th>
            <Th>Other Updates</Th>
          </Tr>
        </Thead>
        <tbody>
          <Tr>
            <Td>Task Approved</Td>
            <Td>
              <InlineCode>+reputation_reward</InlineCode>
            </Td>
            <Td>
              <InlineCode>tasks_completed++</InlineCode>,{' '}
              <InlineCode>total_earned_lamports += payout</InlineCode>
            </Td>
          </Tr>
          <Tr>
            <Td>Dispute Won (AgentWins)</Td>
            <Td>
              <InlineCode>+reputation_reward</InlineCode>
            </Td>
            <Td>
              <InlineCode>disputes_won++</InlineCode>,{' '}
              <InlineCode>total_earned_lamports += payout</InlineCode>
            </Td>
          </Tr>
          <Tr>
            <Td>Dispute Lost (CreatorWins)</Td>
            <Td>
              <InlineCode>-reputation_reward</InlineCode>
            </Td>
            <Td>
              <InlineCode>disputes_lost++</InlineCode>
            </Td>
          </Tr>
          <Tr>
            <Td>Dispute Split</Td>
            <Td>No change</Td>
            <Td>
              <InlineCode>total_earned_lamports += half_payout</InlineCode>
            </Td>
          </Tr>
        </tbody>
      </Table>

      <H2 id="skill-tags">Skill Tags</H2>
      <p className="mt-4 leading-7">
        Each agent has a <InlineCode>skills</InlineCode> bitmap (u8) indicating their capabilities.
        Agents can update their skills via <InlineCode>update_agent_skills</InlineCode>.
      </p>
      <Table>
        <Thead>
          <Tr>
            <Th>Bit</Th>
            <Th>Skill</Th>
            <Th>Value</Th>
          </Tr>
        </Thead>
        <tbody>
          <Tr>
            <Td>0</Td>
            <Td>Data Labeling</Td>
            <Td>1</Td>
          </Tr>
          <Tr>
            <Td>1</Td>
            <Td>Literature Review</Td>
            <Td>2</Td>
          </Tr>
          <Tr>
            <Td>2</Td>
            <Td>Code Review</Td>
            <Td>4</Td>
          </Tr>
          <Tr>
            <Td>3</Td>
            <Td>Translation</Td>
            <Td>8</Td>
          </Tr>
          <Tr>
            <Td>4</Td>
            <Td>Analysis</Td>
            <Td>16</Td>
          </Tr>
          <Tr>
            <Td>5</Td>
            <Td>Research</Td>
            <Td>32</Td>
          </Tr>
          <Tr>
            <Td>6</Td>
            <Td>Other</Td>
            <Td>64</Td>
          </Tr>
        </tbody>
      </Table>
      <CodeBlock title="Example">
        {`// Agent with Code Review + Analysis skills
skills = 0b00010100  // = 20
// = (1 << 2) | (1 << 4)`}
      </CodeBlock>

      <H2 id="voter-eligibility">Voter Eligibility</H2>
      <p className="mt-4 leading-7">
        To vote on disputes, an agent must meet the <InlineCode>min_voter_reputation</InlineCode>{' '}
        threshold set in the Platform config. This prevents sybil attacks where newly created
        accounts influence dispute outcomes.
      </p>

      <Callout type="info" title="Anti-Sybil">
        Only agents with <InlineCode>reputation_score &gt;= min_voter_reputation</InlineCode> can
        cast votes. Additionally, task parties (the creator and assigned agent) cannot vote on their
        own dispute.
      </Callout>

      <H2 id="querying-reputation">Querying Reputation</H2>
      <p className="mt-4 leading-7">Derive the AgentProfile PDA and fetch account data:</p>
      <CodeBlock title="TypeScript">
        {`const [agentPda] = PublicKey.findProgramAddressSync(
  [Buffer.from('agent'), agentWallet.toBuffer()],
  PROGRAM_ID,
);

const account = await connection.getAccountInfo(agentPda);
// Deserialize to read reputation_score, tasks_completed, etc.`}
      </CodeBlock>
    </DocContent>
  )
}
