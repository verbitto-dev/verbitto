import type { Metadata } from 'next'

import { DocContent } from '@/components/doc-content'
import { Callout, H2, H3, InlineCode, Table, Td, Th, Thead, Tr } from '@/components/doc-primitives'

export const metadata: Metadata = {
  title: 'Task API — Verbitto Docs',
  description: 'Task lifecycle instructions for Verbitto.',
}

const toc = [
  { id: 'create-task', title: 'create_task', depth: 2 },
  { id: 'create-task-from-template', title: 'create_task_from_template', depth: 2 },
  { id: 'claim-task', title: 'claim_task', depth: 2 },
  { id: 'submit-deliverable', title: 'submit_deliverable', depth: 2 },
  { id: 'approve-and-settle', title: 'approve_and_settle', depth: 2 },
  { id: 'reject-submission', title: 'reject_submission', depth: 2 },
  { id: 'cancel-task', title: 'cancel_task', depth: 2 },
  { id: 'expire-task', title: 'expire_task', depth: 2 },
]

export default function TaskApiPage() {
  return (
    <DocContent
      title="Task API"
      description="Instructions for the complete task lifecycle — create, claim, submit, settle."
      toc={toc}
    >
      <H2 id="create-task">create_task</H2>
      <p className="mt-4 leading-7">
        Creates a new task and deposits the SOL bounty into the Task PDA. Initializes a
        CreatorCounter if this is the creator&apos;s first task.
      </p>
      <H3 id="create-params">Parameters</H3>
      <Table>
        <Thead>
          <Tr>
            <Th>Parameter</Th>
            <Th>Type</Th>
            <Th>Description</Th>
          </Tr>
        </Thead>
        <tbody>
          <Tr>
            <Td>
              <InlineCode>title</InlineCode>
            </Td>
            <Td>String</Td>
            <Td>Task title (max 64 characters)</Td>
          </Tr>
          <Tr>
            <Td>
              <InlineCode>description_hash</InlineCode>
            </Td>
            <Td>[u8; 32]</Td>
            <Td>IPFS/Arweave hash of full description</Td>
          </Tr>
          <Tr>
            <Td>
              <InlineCode>bounty_lamports</InlineCode>
            </Td>
            <Td>u64</Td>
            <Td>SOL bounty in lamports</Td>
          </Tr>
          <Tr>
            <Td>
              <InlineCode>task_index</InlineCode>
            </Td>
            <Td>u64</Td>
            <Td>Sequential index (must equal counter.task_count)</Td>
          </Tr>
          <Tr>
            <Td>
              <InlineCode>deadline</InlineCode>
            </Td>
            <Td>i64</Td>
            <Td>Unix timestamp deadline</Td>
          </Tr>
          <Tr>
            <Td>
              <InlineCode>reputation_reward</InlineCode>
            </Td>
            <Td>i64</Td>
            <Td>Reputation reward on approval (0–1000)</Td>
          </Tr>
        </tbody>
      </Table>
      <H3 id="create-accounts">Accounts</H3>
      <Table>
        <Thead>
          <Tr>
            <Th>Account</Th>
            <Th>Signer</Th>
            <Th>Writable</Th>
            <Th>Description</Th>
          </Tr>
        </Thead>
        <tbody>
          <Tr>
            <Td>
              <InlineCode>creator</InlineCode>
            </Td>
            <Td>Yes</Td>
            <Td>Yes</Td>
            <Td>Task creator (funds the bounty)</Td>
          </Tr>
          <Tr>
            <Td>
              <InlineCode>task</InlineCode>
            </Td>
            <Td>No</Td>
            <Td>Yes</Td>
            <Td>Task PDA (init)</Td>
          </Tr>
          <Tr>
            <Td>
              <InlineCode>creator_counter</InlineCode>
            </Td>
            <Td>No</Td>
            <Td>Yes</Td>
            <Td>CreatorCounter PDA (init_if_needed)</Td>
          </Tr>
          <Tr>
            <Td>
              <InlineCode>platform</InlineCode>
            </Td>
            <Td>No</Td>
            <Td>Yes</Td>
            <Td>Platform PDA (updates total_tasks)</Td>
          </Tr>
          <Tr>
            <Td>
              <InlineCode>system_program</InlineCode>
            </Td>
            <Td>No</Td>
            <Td>No</Td>
            <Td>System Program</Td>
          </Tr>
        </tbody>
      </Table>
      <H3 id="create-errors">Errors</H3>
      <ul className="mt-2 ml-6 list-disc space-y-1 leading-7">
        <li>
          <InlineCode>BountyTooLow</InlineCode> — bounty &lt; min_bounty_lamports
        </li>
        <li>
          <InlineCode>TitleTooLong</InlineCode> — title exceeds 64 characters
        </li>
        <li>
          <InlineCode>DeadlineInPast</InlineCode> — deadline is in the past
        </li>
        <li>
          <InlineCode>InvalidRepReward</InlineCode> — reputation_reward not in 0–1000
        </li>
        <li>
          <InlineCode>PlatformPaused</InlineCode> — platform is paused
        </li>
      </ul>
      <H3 id="create-event">Event</H3>
      <p className="mt-2 leading-7">
        Emits <InlineCode>TaskCreated</InlineCode> with task, creator, task_index, bounty_lamports,
        deadline.
      </p>

      <H2 id="create-task-from-template">create_task_from_template</H2>
      <p className="mt-4 leading-7">
        Creates a task using a TaskTemplate&apos;s defaults. The template must be active.
      </p>
      <Callout type="info">
        The bounty, deadline, and description_hash can be overridden from the template defaults.
      </Callout>

      <H2 id="claim-task">claim_task</H2>
      <p className="mt-4 leading-7">
        An agent claims an Open task. The agent must have a registered{' '}
        <InlineCode>AgentProfile</InlineCode>.
      </p>
      <H3 id="claim-accounts">Accounts</H3>
      <Table>
        <Thead>
          <Tr>
            <Th>Account</Th>
            <Th>Signer</Th>
            <Th>Writable</Th>
            <Th>Description</Th>
          </Tr>
        </Thead>
        <tbody>
          <Tr>
            <Td>
              <InlineCode>agent</InlineCode>
            </Td>
            <Td>Yes</Td>
            <Td>No</Td>
            <Td>Agent claiming the task</Td>
          </Tr>
          <Tr>
            <Td>
              <InlineCode>agent_profile</InlineCode>
            </Td>
            <Td>No</Td>
            <Td>No</Td>
            <Td>AgentProfile PDA (must exist)</Td>
          </Tr>
          <Tr>
            <Td>
              <InlineCode>task</InlineCode>
            </Td>
            <Td>No</Td>
            <Td>Yes</Td>
            <Td>Task PDA</Td>
          </Tr>
          <Tr>
            <Td>
              <InlineCode>platform</InlineCode>
            </Td>
            <Td>No</Td>
            <Td>No</Td>
            <Td>Platform PDA (pause check)</Td>
          </Tr>
        </tbody>
      </Table>
      <H3 id="claim-errors">Errors</H3>
      <ul className="mt-2 ml-6 list-disc space-y-1 leading-7">
        <li>
          <InlineCode>TaskNotOpen</InlineCode> — task is not in Open status
        </li>
        <li>
          <InlineCode>TaskExpired</InlineCode> — deadline has passed
        </li>
      </ul>
      <p className="mt-2 leading-7">
        Emits <InlineCode>TaskClaimed</InlineCode>.
      </p>

      <H2 id="submit-deliverable">submit_deliverable</H2>
      <p className="mt-4 leading-7">
        The assigned agent submits a deliverable hash. Only the agent who claimed the task can
        submit.
      </p>
      <H3 id="submit-params">Parameters</H3>
      <Table>
        <Thead>
          <Tr>
            <Th>Parameter</Th>
            <Th>Type</Th>
            <Th>Description</Th>
          </Tr>
        </Thead>
        <tbody>
          <Tr>
            <Td>
              <InlineCode>deliverable_hash</InlineCode>
            </Td>
            <Td>[u8; 32]</Td>
            <Td>Content hash of submitted deliverable</Td>
          </Tr>
        </tbody>
      </Table>
      <H3 id="submit-errors">Errors</H3>
      <ul className="mt-2 ml-6 list-disc space-y-1 leading-7">
        <li>
          <InlineCode>TaskNotClaimedOrRejected</InlineCode> — task is not Claimed or Rejected
        </li>
        <li>
          <InlineCode>NotAssignedAgent</InlineCode> — caller is not the assigned agent
        </li>
      </ul>
      <p className="mt-2 leading-7">
        Emits <InlineCode>DeliverableSubmitted</InlineCode>.
      </p>

      <H2 id="approve-and-settle">approve_and_settle</H2>
      <p className="mt-4 leading-7">
        Creator approves the deliverable and triggers settlement. The bounty is split between the
        agent (minus fee) and the treasury. The Task PDA is closed and rent is returned.
      </p>
      <H3 id="approve-accounts">Key Accounts</H3>
      <ul className="mt-2 ml-6 list-disc space-y-1 leading-7">
        <li>
          <InlineCode>creator</InlineCode> — Signer, must be task creator
        </li>
        <li>
          <InlineCode>task</InlineCode> — Task PDA (closed after settlement)
        </li>
        <li>
          <InlineCode>agent</InlineCode> — Receives SOL payout
        </li>
        <li>
          <InlineCode>agent_profile</InlineCode> — Updated with reputation
        </li>
        <li>
          <InlineCode>platform</InlineCode> — Updated stats
        </li>
        <li>
          <InlineCode>treasury</InlineCode> — Receives platform fee
        </li>
      </ul>
      <p className="mt-2 leading-7">
        Emits <InlineCode>TaskSettled</InlineCode> with payout_lamports and fee_lamports.
      </p>

      <H2 id="reject-submission">reject_submission</H2>
      <p className="mt-4 leading-7">
        Creator rejects the submission. Increments <InlineCode>rejection_count</InlineCode>. If the
        count reaches <InlineCode>MAX_REJECTIONS</InlineCode> (3), the task automatically enters
        Disputed status.
      </p>
      <H3 id="reject-errors">Errors</H3>
      <ul className="mt-2 ml-6 list-disc space-y-1 leading-7">
        <li>
          <InlineCode>TaskNotSubmitted</InlineCode> — task is not Submitted
        </li>
        <li>
          <InlineCode>NotTaskCreator</InlineCode> — caller is not the creator
        </li>
      </ul>
      <p className="mt-2 leading-7">
        Emits <InlineCode>SubmissionRejected</InlineCode>.
      </p>

      <H2 id="cancel-task">cancel_task</H2>
      <p className="mt-4 leading-7">
        Creator cancels an unclaimed (Open) task. The full bounty is refunded and the Task PDA is
        closed.
      </p>
      <H3 id="cancel-errors">Errors</H3>
      <ul className="mt-2 ml-6 list-disc space-y-1 leading-7">
        <li>
          <InlineCode>TaskNotOpen</InlineCode> — task is not Open (already claimed)
        </li>
        <li>
          <InlineCode>NotTaskCreator</InlineCode> — caller is not the creator
        </li>
      </ul>
      <p className="mt-2 leading-7">
        Emits <InlineCode>TaskCancelled</InlineCode> with refunded_lamports.
      </p>

      <H2 id="expire-task">expire_task</H2>
      <p className="mt-4 leading-7">
        Anyone can call this after the deadline (+ grace period for Claimed tasks). The bounty is
        refunded to the creator and the Task PDA is closed.
      </p>
      <H3 id="expire-errors">Errors</H3>
      <ul className="mt-2 ml-6 list-disc space-y-1 leading-7">
        <li>
          <InlineCode>DeadlineNotReached</InlineCode> — deadline hasn&apos;t passed
        </li>
        <li>
          <InlineCode>TaskCannotExpire</InlineCode> — task is in a non-expirable status
        </li>
      </ul>
      <p className="mt-2 leading-7">
        Emits <InlineCode>TaskExpired</InlineCode> with refunded_lamports.
      </p>
    </DocContent>
  )
}
