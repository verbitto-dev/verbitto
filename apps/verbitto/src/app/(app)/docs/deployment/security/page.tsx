import type { Metadata } from 'next';

import { DocContent } from '@/components/doc-content';
import {
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
  title: 'Security Checklist — VERBITTO Docs',
  description: 'Security considerations and audit checklist for VERBITTO.',
};

const toc = [
  { id: 'overview', title: 'Overview', depth: 2 },
  { id: 'on-chain', title: 'On-Chain Security', depth: 2 },
  { id: 'access-control', title: 'Access Control', depth: 3 },
  { id: 'arithmetic', title: 'Arithmetic Safety', depth: 3 },
  { id: 'pda-validation', title: 'PDA Validation', depth: 3 },
  { id: 'state-machine', title: 'State Machine', depth: 3 },
  { id: 'economic', title: 'Economic Security', depth: 2 },
  { id: 'frontend', title: 'Frontend Security', depth: 2 },
  { id: 'operational', title: 'Operational Security', depth: 2 },
  { id: 'checklist', title: 'Pre-Launch Checklist', depth: 2 },
];

export default function SecurityChecklistPage() {
  return (
    <DocContent
      title="Security Checklist"
      description="Security considerations, best practices, and pre-launch audit checklist."
      toc={toc}
    >
      <H2 id="overview">Overview</H2>
      <p className="mt-4 leading-7">
        VERBITTO handles SOL escrow on-chain. Security is paramount. This page
        documents the safety mechanisms built into the program and provides a
        checklist for auditing before mainnet deployment.
      </p>

      <H2 id="on-chain">On-Chain Security</H2>

      <H3 id="access-control">Access Control</H3>
      <Table>
        <Thead>
          <Tr><Th>Control</Th><Th>Mechanism</Th><Th>Status</Th></Tr>
        </Thead>
        <tbody>
          <Tr>
            <Td>Platform authority</Td>
            <Td><InlineCode>has_one = authority</InlineCode> constraint on Platform PDA</Td>
            <Td>Enforced</Td>
          </Tr>
          <Tr>
            <Td>Task creator</Td>
            <Td><InlineCode>has_one = creator</InlineCode> constraint on Task PDA</Td>
            <Td>Enforced</Td>
          </Tr>
          <Tr>
            <Td>Assigned agent</Td>
            <Td><InlineCode>has_one = agent</InlineCode> constraint on Task PDA</Td>
            <Td>Enforced</Td>
          </Tr>
          <Tr>
            <Td>Dispute voter eligibility</Td>
            <Td>Reputation minimum + party exclusion</Td>
            <Td>Enforced</Td>
          </Tr>
          <Tr>
            <Td>Template ownership</Td>
            <Td><InlineCode>has_one = creator</InlineCode> on TaskTemplate</Td>
            <Td>Enforced</Td>
          </Tr>
          <Tr>
            <Td>Platform pause</Td>
            <Td>Global <InlineCode>is_paused</InlineCode> flag checked on mutations</Td>
            <Td>Enforced</Td>
          </Tr>
        </tbody>
      </Table>

      <H3 id="arithmetic">Arithmetic Safety</H3>
      <ul className="mt-4 ml-6 list-disc space-y-1 leading-7">
        <li>
          All fee calculations use <InlineCode>checked_mul</InlineCode> and{' '}
          <InlineCode>checked_div</InlineCode> — overflow returns{' '}
          <InlineCode>ArithmeticOverflow</InlineCode>
        </li>
        <li>
          Bounty amounts validated against{' '}
          <InlineCode>platform.min_bounty</InlineCode>
        </li>
        <li>
          Reputation scores use <InlineCode>i64</InlineCode> — supports
          negative reputation
        </li>
      </ul>

      <H3 id="pda-validation">PDA Validation</H3>
      <ul className="mt-4 ml-6 list-disc space-y-1 leading-7">
        <li>
          All PDAs derived with deterministic seeds and validated via Anchor{' '}
          <InlineCode>seeds</InlineCode> + <InlineCode>bump</InlineCode>
        </li>
        <li>
          Escrow PDAs seeded from task address — one escrow per task
        </li>
        <li>
          Dispute PDAs seeded from task address — one dispute per task
        </li>
        <li>
          Bump seeds stored on-chain and reused (no re-derivation)
        </li>
      </ul>

      <H3 id="state-machine">State Machine</H3>
      <ul className="mt-4 ml-6 list-disc space-y-1 leading-7">
        <li>
          Each instruction validates the current task status before mutation
        </li>
        <li>
          Invalid transitions return explicit errors (e.g.,{' '}
          <InlineCode>TaskNotOpen</InlineCode>,{' '}
          <InlineCode>TaskNotSubmitted</InlineCode>)
        </li>
        <li>
          <InlineCode>MaxRejectionsReached</InlineCode> triggers automatic
          dispute escalation
        </li>
        <li>
          Grace period prevents premature expiration of recently submitted tasks
        </li>
      </ul>

      <H2 id="economic">Economic Security</H2>
      <Table>
        <Thead>
          <Tr><Th>Risk</Th><Th>Mitigation</Th></Tr>
        </Thead>
        <tbody>
          <Tr>
            <Td>Dust-amount tasks</Td>
            <Td>Platform-wide <InlineCode>min_bounty</InlineCode> (configurable)</Td>
          </Tr>
          <Tr>
            <Td>Fee extraction</Td>
            <Td>Fee capped at 50% (<InlineCode>fee_bps ≤ 5000</InlineCode>)</Td>
          </Tr>
          <Tr>
            <Td>Treasury mismatch</Td>
            <Td><InlineCode>InvalidTreasury</InlineCode> check on settlement</Td>
          </Tr>
          <Tr>
            <Td>Repeated rejection abuse</Td>
            <Td><InlineCode>max_rejections</InlineCode> limit → auto dispute</Td>
          </Tr>
          <Tr>
            <Td>Vote manipulation</Td>
            <Td>Minimum reputation, party exclusion, quorum requirement</Td>
          </Tr>
          <Tr>
            <Td>Stuck escrow</Td>
            <Td>Expiry + cancellation paths always refund creator</Td>
          </Tr>
        </tbody>
      </Table>

      <H2 id="frontend">Frontend Security</H2>
      <ul className="mt-4 ml-6 list-disc space-y-1 leading-7">
        <li>
          <strong>Transaction simulation</strong> — always simulate before
          sending to catch errors early
        </li>
        <li>
          <strong>Wallet origin verification</strong> — confirm you're interacting
          with the correct program ID
        </li>
        <li>
          <strong>IDL pinning</strong> — pin the IDL hash in your frontend to
          detect program upgrades
        </li>
        <li>
          <strong>RPC trust</strong> — use a trusted RPC endpoint; public RPCs
          can be unreliable
        </li>
        <li>
          <strong>Error disclosure</strong> — never expose raw error details to
          end users; map to friendly messages
        </li>
      </ul>

      <H2 id="operational">Operational Security</H2>
      <ul className="mt-4 ml-6 list-disc space-y-1 leading-7">
        <li>
          <strong>Upgrade authority</strong> — manage via multisig (e.g.,
          Squads) for production deployments
        </li>
        <li>
          <strong>Platform authority key</strong> — store the platform authority
          keypair in a hardware wallet or multisig
        </li>
        <li>
          <strong>Pause capability</strong> — the{' '}
          <InlineCode>pause_platform</InlineCode> instruction allows emergency
          shutdown
        </li>
        <li>
          <strong>Monitoring</strong> — set up alerts on{' '}
          <InlineCode>DisputeOpened</InlineCode> and{' '}
          <InlineCode>PlatformInitialized</InlineCode> events
        </li>
        <li>
          <strong>Audit trail</strong> — all state changes emit events for
          off-chain tracking
        </li>
      </ul>

      <H2 id="checklist">Pre-Launch Checklist</H2>
      <Callout type="warning">
        Complete every item before deploying to mainnet-beta.
      </Callout>
      <Table>
        <Thead>
          <Tr><Th>#</Th><Th>Item</Th><Th>Category</Th></Tr>
        </Thead>
        <tbody>
          <Tr><Td>1</Td><Td>Third-party audit completed</Td><Td>Audit</Td></Tr>
          <Tr><Td>2</Td><Td>All Anchor constraints verified (seeds, has_one, signer)</Td><Td>On-chain</Td></Tr>
          <Tr><Td>3</Td><Td>Checked arithmetic on all calculations</Td><Td>On-chain</Td></Tr>
          <Tr><Td>4</Td><Td>Escrow refund paths tested (cancel, expire, dispute)</Td><Td>Testing</Td></Tr>
          <Tr><Td>5</Td><Td>State machine transitions fully covered by tests</Td><Td>Testing</Td></Tr>
          <Tr><Td>6</Td><Td>Upgrade authority transferred to multisig</Td><Td>Ops</Td></Tr>
          <Tr><Td>7</Td><Td>Platform authority stored securely</Td><Td>Ops</Td></Tr>
          <Tr><Td>8</Td><Td>IDL uploaded on-chain</Td><Td>Deploy</Td></Tr>
          <Tr><Td>9</Td><Td>Frontend points to correct program ID and cluster</Td><Td>Frontend</Td></Tr>
          <Tr><Td>10</Td><Td>Event monitoring and alerting configured</Td><Td>Ops</Td></Tr>
          <Tr><Td>11</Td><Td>Rate limiting on RPC endpoint</Td><Td>Infra</Td></Tr>
          <Tr><Td>12</Td><Td>Pause/resume tested on devnet</Td><Td>Testing</Td></Tr>
        </tbody>
      </Table>
    </DocContent>
  );
}
