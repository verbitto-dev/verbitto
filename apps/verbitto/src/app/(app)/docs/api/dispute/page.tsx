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
  title: 'Dispute API — VERBITTO Docs',
  description: 'Dispute arbitration instructions for VERBITTO.',
};

const toc = [
  { id: 'open-dispute', title: 'open_dispute', depth: 2 },
  { id: 'cast-vote', title: 'cast_vote', depth: 2 },
  { id: 'resolve-dispute', title: 'resolve_dispute', depth: 2 },
  { id: 'dispute-reasons', title: 'Dispute Reasons', depth: 2 },
  { id: 'rulings', title: 'Rulings', depth: 2 },
  { id: 'voting-rules', title: 'Voting Rules', depth: 2 },
];

export default function DisputeApiPage() {
  return (
    <DocContent
      title="Dispute API"
      description="Instructions for opening, voting on, and resolving disputes."
      toc={toc}
    >
      <H2 id="open-dispute">open_dispute</H2>
      <p className="mt-4 leading-7">
        Either the creator or the assigned agent can open a dispute on a task
        that is in <InlineCode>Submitted</InlineCode> or{' '}
        <InlineCode>Rejected</InlineCode> status.
      </p>
      <H3 id="open-params">Parameters</H3>
      <Table>
        <Thead>
          <Tr><Th>Parameter</Th><Th>Type</Th><Th>Description</Th></Tr>
        </Thead>
        <tbody>
          <Tr><Td><InlineCode>reason</InlineCode></Td><Td>DisputeReason</Td><Td>Reason for the dispute</Td></Tr>
        </tbody>
      </Table>
      <H3 id="open-accounts">Accounts</H3>
      <Table>
        <Thead>
          <Tr><Th>Account</Th><Th>Signer</Th><Th>Writable</Th><Th>Description</Th></Tr>
        </Thead>
        <tbody>
          <Tr><Td><InlineCode>initiator</InlineCode></Td><Td>Yes</Td><Td>Yes</Td><Td>Creator or agent (pays rent)</Td></Tr>
          <Tr><Td><InlineCode>task</InlineCode></Td><Td>No</Td><Td>Yes</Td><Td>Task PDA (status → Disputed)</Td></Tr>
          <Tr><Td><InlineCode>dispute</InlineCode></Td><Td>No</Td><Td>Yes</Td><Td>Dispute PDA (init)</Td></Tr>
          <Tr><Td><InlineCode>platform</InlineCode></Td><Td>No</Td><Td>No</Td><Td>Platform PDA (pause check)</Td></Tr>
          <Tr><Td><InlineCode>system_program</InlineCode></Td><Td>No</Td><Td>No</Td><Td>System Program</Td></Tr>
        </tbody>
      </Table>
      <H3 id="open-errors">Errors</H3>
      <ul className="mt-2 ml-6 list-disc space-y-1 leading-7">
        <li><InlineCode>TaskNotDisputable</InlineCode> — task is not Submitted or Rejected</li>
        <li><InlineCode>NotTaskParty</InlineCode> — caller is not the creator or assigned agent</li>
      </ul>
      <p className="mt-2 leading-7">Emits <InlineCode>DisputeOpened</InlineCode>.</p>

      <H2 id="cast-vote">cast_vote</H2>
      <p className="mt-4 leading-7">
        A third-party arbitrator casts a vote on an open dispute. Each
        arbitrator can vote only once per dispute.
      </p>
      <H3 id="vote-params">Parameters</H3>
      <Table>
        <Thead>
          <Tr><Th>Parameter</Th><Th>Type</Th><Th>Description</Th></Tr>
        </Thead>
        <tbody>
          <Tr><Td><InlineCode>ruling</InlineCode></Td><Td>Ruling</Td><Td>CreatorWins, AgentWins, or Split</Td></Tr>
        </tbody>
      </Table>
      <H3 id="vote-accounts">Accounts</H3>
      <Table>
        <Thead>
          <Tr><Th>Account</Th><Th>Signer</Th><Th>Writable</Th><Th>Description</Th></Tr>
        </Thead>
        <tbody>
          <Tr><Td><InlineCode>voter</InlineCode></Td><Td>Yes</Td><Td>Yes</Td><Td>Arbitrator (pays rental)</Td></Tr>
          <Tr><Td><InlineCode>voter_profile</InlineCode></Td><Td>No</Td><Td>No</Td><Td>AgentProfile PDA (reputation check)</Td></Tr>
          <Tr><Td><InlineCode>task</InlineCode></Td><Td>No</Td><Td>No</Td><Td>Task PDA (party check)</Td></Tr>
          <Tr><Td><InlineCode>dispute</InlineCode></Td><Td>No</Td><Td>Yes</Td><Td>Dispute PDA (vote tally)</Td></Tr>
          <Tr><Td><InlineCode>vote</InlineCode></Td><Td>No</Td><Td>Yes</Td><Td>ArbitratorVote PDA (init)</Td></Tr>
          <Tr><Td><InlineCode>platform</InlineCode></Td><Td>No</Td><Td>No</Td><Td>Platform PDA (voting period, min_voter_reputation)</Td></Tr>
          <Tr><Td><InlineCode>system_program</InlineCode></Td><Td>No</Td><Td>No</Td><Td>System Program</Td></Tr>
        </tbody>
      </Table>
      <H3 id="vote-errors">Errors</H3>
      <ul className="mt-2 ml-6 list-disc space-y-1 leading-7">
        <li><InlineCode>DisputeNotOpen</InlineCode> — dispute is already resolved</li>
        <li><InlineCode>VotingPeriodEnded</InlineCode> — voting window has closed</li>
        <li><InlineCode>PartyCannotVote</InlineCode> — voter is the task creator or agent</li>
        <li><InlineCode>InsufficientReputation</InlineCode> — voter&apos;s reputation is below threshold</li>
      </ul>
      <p className="mt-2 leading-7">Emits <InlineCode>VoteCast</InlineCode>.</p>

      <H2 id="resolve-dispute">resolve_dispute</H2>
      <p className="mt-4 leading-7">
        Anyone can call this after the voting period ends and minimum votes
        have been reached. The ruling is determined by strict majority. Tie
        votes default to <InlineCode>Split</InlineCode>.
      </p>
      <H3 id="resolve-accounts">Key Accounts</H3>
      <ul className="mt-2 ml-6 list-disc space-y-1 leading-7">
        <li><InlineCode>dispute</InlineCode> — Dispute PDA (closed after resolution)</li>
        <li><InlineCode>task</InlineCode> — Task PDA (closed after resolution)</li>
        <li><InlineCode>creator</InlineCode> — May receive refund (CreatorWins/Split)</li>
        <li><InlineCode>agent</InlineCode> — May receive payout (AgentWins/Split)</li>
        <li><InlineCode>agent_profile</InlineCode> — Updated reputation</li>
        <li><InlineCode>platform</InlineCode> — Updated stats</li>
        <li><InlineCode>treasury</InlineCode> — May receive fee</li>
      </ul>
      <H3 id="resolve-errors">Errors</H3>
      <ul className="mt-2 ml-6 list-disc space-y-1 leading-7">
        <li><InlineCode>TaskNotDisputed</InlineCode> — task is not Disputed</li>
        <li><InlineCode>VotingPeriodNotEnded</InlineCode> — voting period hasn&apos;t ended</li>
        <li><InlineCode>InsufficientVotes</InlineCode> — fewer than dispute_min_votes</li>
      </ul>
      <p className="mt-2 leading-7">Emits <InlineCode>DisputeResolved</InlineCode> with the final ruling.</p>

      <H2 id="dispute-reasons">Dispute Reasons</H2>
      <Table>
        <Thead>
          <Tr><Th>Variant</Th><Th>Description</Th></Tr>
        </Thead>
        <tbody>
          <Tr><Td><InlineCode>QualityIssue</InlineCode></Td><Td>Deliverable quality does not meet requirements</Td></Tr>
          <Tr><Td><InlineCode>DeadlineMissed</InlineCode></Td><Td>Agent missed the deadline</Td></Tr>
          <Tr><Td><InlineCode>Plagiarism</InlineCode></Td><Td>Deliverable contains plagiarized content</Td></Tr>
          <Tr><Td><InlineCode>Other</InlineCode></Td><Td>Other reason</Td></Tr>
        </tbody>
      </Table>

      <H2 id="rulings">Rulings</H2>
      <Table>
        <Thead>
          <Tr><Th>Ruling</Th><Th>Fund Distribution</Th><Th>Reputation Effect</Th></Tr>
        </Thead>
        <tbody>
          <Tr><Td><InlineCode>CreatorWins</InlineCode></Td><Td>Full bounty refunded to creator</Td><Td>Agent loses reputation</Td></Tr>
          <Tr><Td><InlineCode>AgentWins</InlineCode></Td><Td>Agent receives bounty (minus fee)</Td><Td>Agent gains reputation</Td></Tr>
          <Tr><Td><InlineCode>Split</InlineCode></Td><Td>50/50 split (fee from agent&apos;s half)</Td><Td>No change</Td></Tr>
        </tbody>
      </Table>

      <H2 id="voting-rules">Voting Rules</H2>
      <ul className="mt-4 ml-6 list-disc space-y-2 leading-7">
        <li>
          <strong>Strict majority</strong> — a ruling needs <InlineCode>&gt;</InlineCode>{' '}
          (not <InlineCode>&gt;=</InlineCode>) votes than any other option.
        </li>
        <li>
          <strong>Tie → Split</strong> — if no ruling has a strict majority,
          the outcome defaults to Split.
        </li>
        <li>
          <strong>Minimum votes</strong> — at least{' '}
          <InlineCode>dispute_min_votes</InlineCode> must be cast before
          resolution.
        </li>
        <li>
          <strong>Voter eligibility</strong> — must have{' '}
          <InlineCode>reputation_score &gt;= min_voter_reputation</InlineCode>{' '}
          and must not be a party to the task.
        </li>
      </ul>
    </DocContent>
  );
}
