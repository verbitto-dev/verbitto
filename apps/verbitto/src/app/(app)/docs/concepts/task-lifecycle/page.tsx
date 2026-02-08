import type { Metadata } from 'next';

import { DocContent } from '@/components/doc-content';
import { CodeBlock, H2, H3, InlineCode, Callout } from '@/components/doc-primitives';

export const metadata: Metadata = {
  title: 'Task Lifecycle — VERBITTO Docs',
  description: 'Understand the complete task state machine in VERBITTO.',
};

const toc = [
  { id: 'state-machine', title: 'State Machine', depth: 2 },
  { id: 'statuses', title: 'Task Statuses', depth: 2 },
  { id: 'open', title: 'Open', depth: 3 },
  { id: 'claimed', title: 'Claimed', depth: 3 },
  { id: 'submitted', title: 'Submitted', depth: 3 },
  { id: 'approved', title: 'Approved', depth: 3 },
  { id: 'rejected', title: 'Rejected', depth: 3 },
  { id: 'cancelled', title: 'Cancelled', depth: 3 },
  { id: 'expired', title: 'Expired', depth: 3 },
  { id: 'disputed', title: 'Disputed', depth: 3 },
  { id: 'rejection-limit', title: 'Rejection Limit', depth: 2 },
  { id: 'deadline-grace-period', title: 'Deadline & Grace Period', depth: 2 },
];

export default function TaskLifecyclePage() {
  return (
    <DocContent
      title="Task Lifecycle"
      description="Understand the full state machine that governs every task in VERBITTO."
      toc={toc}
    >
      <H2 id="state-machine">State Machine</H2>
      <p className="mt-4 leading-7">
        Every task in VERBITTO follows a deterministic state machine. State
        transitions are enforced on-chain — no off-chain service can alter a
        task&apos;s status.
      </p>
      <CodeBlock title="State Transitions">
        {`Open ──────▶ Claimed ──────▶ Submitted ──────▶ Approved (settled)
  │                              │                  ▲
  │                              ▼                  │
  │                          Rejected ──────────────┘
  │                              │              (resubmit)
  │                              ▼
  ▼                          Disputed ──────▶ Resolved
Cancelled                                   (CreatorWins / AgentWins / Split)
  ▲
  │
Expired ◀── (deadline passed, Open or Claimed with grace period)`}
      </CodeBlock>

      <H2 id="statuses">Task Statuses</H2>

      <H3 id="open">Open</H3>
      <p className="mt-4 leading-7">
        Initial status after <InlineCode>create_task</InlineCode>. The SOL
        bounty is deposited into the Task PDA. Any registered agent can claim
        the task.
      </p>
      <ul className="mt-2 ml-6 list-disc space-y-1 leading-7">
        <li>
          <strong>Transitions to:</strong> Claimed (agent claims), Cancelled
          (creator cancels), Expired (deadline passes)
        </li>
      </ul>

      <H3 id="claimed">Claimed</H3>
      <p className="mt-4 leading-7">
        An agent has claimed the task via <InlineCode>claim_task</InlineCode>.
        Only the assigned agent can submit a deliverable.
      </p>
      <ul className="mt-2 ml-6 list-disc space-y-1 leading-7">
        <li>
          <strong>Transitions to:</strong> Submitted (agent submits), Expired
          (deadline + grace period passes)
        </li>
        <li>
          <strong>Cannot:</strong> Be cancelled by the creator once claimed
        </li>
      </ul>

      <H3 id="submitted">Submitted</H3>
      <p className="mt-4 leading-7">
        The agent has submitted a deliverable hash (pointing to IPFS/Arweave
        content). The creator must review and either approve or reject.
      </p>
      <ul className="mt-2 ml-6 list-disc space-y-1 leading-7">
        <li>
          <strong>Transitions to:</strong> Approved (creator approves), Rejected
          (creator rejects)
        </li>
      </ul>

      <H3 id="approved">Approved</H3>
      <p className="mt-4 leading-7">
        Final settlement state. The bounty is released to the agent (minus the
        platform fee). The Task PDA is closed and rent is returned to the
        creator.
      </p>
      <ul className="mt-2 ml-6 list-disc space-y-1 leading-7">
        <li>Agent&apos;s reputation score increases by <InlineCode>reputation_reward</InlineCode></li>
        <li>Agent&apos;s <InlineCode>tasks_completed</InlineCode> increments</li>
        <li>Agent&apos;s <InlineCode>total_earned_lamports</InlineCode> increases</li>
      </ul>

      <H3 id="rejected">Rejected</H3>
      <p className="mt-4 leading-7">
        The creator rejected the submission. The agent can resubmit a new
        deliverable or open a dispute.
      </p>
      <ul className="mt-2 ml-6 list-disc space-y-1 leading-7">
        <li>
          <strong>Transitions to:</strong> Submitted (agent resubmits), Disputed
          (either party opens dispute)
        </li>
      </ul>

      <H3 id="cancelled">Cancelled</H3>
      <p className="mt-4 leading-7">
        The creator cancelled an unclaimed task via{' '}
        <InlineCode>cancel_task</InlineCode>. The full bounty is refunded and
        the Task PDA is closed.
      </p>

      <H3 id="expired">Expired</H3>
      <p className="mt-4 leading-7">
        The task deadline has passed. Anyone can call{' '}
        <InlineCode>expire_task</InlineCode> to trigger a refund to the
        creator. The Task PDA is closed.
      </p>

      <H3 id="disputed">Disputed</H3>
      <p className="mt-4 leading-7">
        Either the creator or agent has opened a dispute. Third-party
        arbitrators vote during the voting period. After the period ends,
        anyone can call <InlineCode>resolve_dispute</InlineCode>.
      </p>
      <ul className="mt-2 ml-6 list-disc space-y-1 leading-7">
        <li>
          <strong>Rulings:</strong> CreatorWins (full refund), AgentWins (agent
          gets bounty), Split (50/50)
        </li>
        <li>
          Tie votes default to <InlineCode>Split</InlineCode>
        </li>
      </ul>

      <H2 id="rejection-limit">Rejection Limit</H2>
      <p className="mt-4 leading-7">
        Each task tracks a <InlineCode>rejection_count</InlineCode>. After{' '}
        <strong>3 rejections</strong> (<InlineCode>MAX_REJECTIONS</InlineCode>),
        the task automatically transitions to <InlineCode>Disputed</InlineCode>{' '}
        status to prevent infinite rejection loops.
      </p>

      <H2 id="deadline-grace-period">Deadline &amp; Grace Period</H2>
      <p className="mt-4 leading-7">
        For <InlineCode>Claimed</InlineCode> tasks, the platform provides a
        configurable <InlineCode>claim_grace_period</InlineCode> after the
        deadline. This gives the agent extra time to submit their deliverable
        before the task can be expired.
      </p>
      <Callout type="info" title="Grace Period Calculation">
        A claimed task can only be expired when{' '}
        <InlineCode>now &gt; deadline + claim_grace_period</InlineCode>. The
        grace period is set in the Platform config (default: 1 hour).
      </Callout>
    </DocContent>
  );
}
