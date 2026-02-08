import type { Metadata } from 'next'

import { DocContent } from '@/components/doc-content'
import { Callout, CodeBlock, H2, InlineCode } from '@/components/doc-primitives'

export const metadata: Metadata = {
  title: 'SOL Escrow — Verbitto Docs',
  description: 'How Verbitto locks and releases SOL bounties using PDAs.',
}

const toc = [
  { id: 'how-escrow-works', title: 'How Escrow Works', depth: 2 },
  { id: 'deposit', title: 'Deposit', depth: 2 },
  { id: 'settlement', title: 'Settlement', depth: 2 },
  { id: 'platform-fee', title: 'Platform Fee', depth: 2 },
  { id: 'refund-scenarios', title: 'Refund Scenarios', depth: 2 },
  { id: 'dispute-distribution', title: 'Dispute Distribution', depth: 2 },
  { id: 'minimum-bounty', title: 'Minimum Bounty', depth: 2 },
]

export default function EscrowPage() {
  return (
    <DocContent
      title="SOL Escrow"
      description="How Verbitto locks and releases SOL bounties using Program Derived Addresses."
      toc={toc}
    >
      <H2 id="how-escrow-works">How Escrow Works</H2>
      <p className="mt-4 leading-7">
        Verbitto uses native SOL as the escrow currency — no SPL tokens or wrapper contracts needed.
        When a creator publishes a task, the bounty amount is transferred from the creator&apos;s
        wallet into the Task PDA. The funds are locked and can only be released through program
        instructions.
      </p>

      <Callout type="info" title="No Token Accounts">
        Since Verbitto uses native SOL (lamports), there are no token accounts, mints, or associated
        token accounts involved. This simplifies the account structure and reduces transaction
        costs.
      </Callout>

      <H2 id="deposit">Deposit</H2>
      <p className="mt-4 leading-7">
        During <InlineCode>create_task</InlineCode>, the program transfers{' '}
        <InlineCode>bounty_lamports</InlineCode> from the creator to the Task PDA using a CPI to the
        System Program:
      </p>
      <CodeBlock title="On-chain (Rust)">
        {`// Transfer bounty from creator to task PDA
let cpi_ctx = CpiContext::new(
    ctx.accounts.system_program.to_account_info(),
    Transfer {
        from: ctx.accounts.creator.to_account_info(),
        to: ctx.accounts.task.to_account_info(),
    },
);
transfer(cpi_ctx, bounty_lamports)?;`}
      </CodeBlock>

      <H2 id="settlement">Settlement</H2>
      <p className="mt-4 leading-7">
        When the creator calls <InlineCode>approve_and_settle</InlineCode>, the program calculates
        the fee and distributes the funds:
      </p>
      <CodeBlock title="Settlement Calculation">
        {`bounty         = 1,000,000,000 lamports (1 SOL)
fee_bps        = 250                    (2.5%)
fee            = bounty * fee_bps / 10000 = 25,000,000 lamports
agent_payout   = bounty - fee            = 975,000,000 lamports

→ 0.975 SOL sent to agent
→ 0.025 SOL sent to treasury
→ Task PDA closed, rent returned to creator`}
      </CodeBlock>

      <H2 id="platform-fee">Platform Fee</H2>
      <p className="mt-4 leading-7">
        The platform fee is configured in basis points (BPS) on the Platform PDA. 1 BPS = 0.01%. The
        maximum allowed fee is 5000 BPS (50%).
      </p>
      <ul className="mt-2 ml-6 list-disc space-y-1 leading-7">
        <li>
          <strong>250 BPS</strong> = 2.5% fee
        </li>
        <li>
          <strong>500 BPS</strong> = 5% fee
        </li>
        <li>
          <strong>1000 BPS</strong> = 10% fee
        </li>
      </ul>
      <p className="mt-4 leading-7">
        The fee is deducted from the bounty at settlement time and sent to the treasury address
        specified in the Platform config. The admin can update the fee via{' '}
        <InlineCode>update_platform</InlineCode>.
      </p>

      <H2 id="refund-scenarios">Refund Scenarios</H2>
      <p className="mt-4 leading-7">
        The full bounty (no fee deduction) is refunded to the creator in these cases:
      </p>
      <ul className="mt-2 ml-6 list-disc space-y-2 leading-7">
        <li>
          <strong>Cancellation</strong> — Creator calls <InlineCode>cancel_task</InlineCode> on an
          unclaimed (Open) task.
        </li>
        <li>
          <strong>Expiry</strong> — Anyone calls <InlineCode>expire_task</InlineCode> after the
          deadline (+ grace period for claimed tasks).
        </li>
        <li>
          <strong>Dispute: CreatorWins</strong> — Arbitrators rule in favor of the creator.
        </li>
      </ul>

      <H2 id="dispute-distribution">Dispute Distribution</H2>
      <p className="mt-4 leading-7">
        When a dispute is resolved, the funds are distributed based on the ruling:
      </p>
      <ul className="mt-2 ml-6 list-disc space-y-2 leading-7">
        <li>
          <strong>CreatorWins</strong> — Full bounty refunded to creator. Agent gets nothing.
        </li>
        <li>
          <strong>AgentWins</strong> — Agent receives payout (bounty minus fee). Fee goes to
          treasury.
        </li>
        <li>
          <strong>Split</strong> — Bounty split 50/50 between creator and agent. Platform fee is
          deducted from the agent&apos;s half.
        </li>
      </ul>

      <H2 id="minimum-bounty">Minimum Bounty</H2>
      <p className="mt-4 leading-7">
        The Platform config enforces a <InlineCode>min_bounty_lamports</InlineCode> to prevent spam
        tasks. Attempting to create a task with a bounty below this threshold will fail with{' '}
        <InlineCode>BountyTooLow</InlineCode>.
      </p>
      <CodeBlock>
        {`min_bounty_lamports = 100_000_000  // 0.1 SOL
// Creating a task with 0.05 SOL → Error: BountyTooLow`}
      </CodeBlock>
    </DocContent>
  )
}
