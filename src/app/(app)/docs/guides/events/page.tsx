import type { Metadata } from 'next'

import { DocContent } from '@/components/doc-content'
import {
  Callout,
  CodeBlock,
  H2,
  H3,
  InlineCode,
  Table,
  Td,
  Th,
  Thead,
  Tr,
} from '@/components/doc-primitives'

export const metadata: Metadata = {
  title: 'Events & Indexing — Verbitto Docs',
  description: 'Anchor events emitted by the Verbitto program and how to index them.',
}

const toc = [
  { id: 'overview', title: 'Overview', depth: 2 },
  { id: 'event-reference', title: 'Event Reference', depth: 2 },
  { id: 'platform-events', title: 'Platform Events', depth: 3 },
  { id: 'task-events', title: 'Task Events', depth: 3 },
  { id: 'template-events', title: 'Template Events', depth: 3 },
  { id: 'dispute-events', title: 'Dispute Events', depth: 3 },
  { id: 'agent-events', title: 'Agent Events', depth: 3 },
  { id: 'indexing', title: 'Indexing Strategies', depth: 2 },
]

export default function EventsGuidePage() {
  return (
    <DocContent
      title="Events & Indexing"
      description="All Anchor events emitted by the program and strategies for indexing them."
      toc={toc}
    >
      <H2 id="overview">Overview</H2>
      <p className="mt-4 leading-7">
        Verbitto emits Anchor events for every state-changing instruction. These events are embedded
        in transaction logs and can be parsed by any client or indexer that understands the Anchor
        event CPI format.
      </p>

      <H2 id="event-reference">Event Reference</H2>

      <H3 id="platform-events">Platform Events</H3>
      <Table>
        <Thead>
          <Tr>
            <Th>Event</Th>
            <Th>Fields</Th>
            <Th>Emitted By</Th>
          </Tr>
        </Thead>
        <tbody>
          <Tr>
            <Td>
              <InlineCode>PlatformInitialized</InlineCode>
            </Td>
            <Td>authority, fee_bps, treasury</Td>
            <Td>initialize_platform</Td>
          </Tr>
        </tbody>
      </Table>

      <H3 id="task-events">Task Events</H3>
      <Table>
        <Thead>
          <Tr>
            <Th>Event</Th>
            <Th>Fields</Th>
            <Th>Emitted By</Th>
          </Tr>
        </Thead>
        <tbody>
          <Tr>
            <Td>
              <InlineCode>TaskCreated</InlineCode>
            </Td>
            <Td>task, creator, task_index, bounty_lamports, deadline</Td>
            <Td>create_task, create_task_from_template</Td>
          </Tr>
          <Tr>
            <Td>
              <InlineCode>TaskClaimed</InlineCode>
            </Td>
            <Td>task, agent, task_index</Td>
            <Td>claim_task</Td>
          </Tr>
          <Tr>
            <Td>
              <InlineCode>DeliverableSubmitted</InlineCode>
            </Td>
            <Td>task, agent, deliverable_hash</Td>
            <Td>submit_deliverable</Td>
          </Tr>
          <Tr>
            <Td>
              <InlineCode>TaskSettled</InlineCode>
            </Td>
            <Td>task, agent, payout_lamports, fee_lamports</Td>
            <Td>approve_deliverable</Td>
          </Tr>
          <Tr>
            <Td>
              <InlineCode>SubmissionRejected</InlineCode>
            </Td>
            <Td>task, agent, reason_hash</Td>
            <Td>reject_deliverable</Td>
          </Tr>
          <Tr>
            <Td>
              <InlineCode>TaskCancelled</InlineCode>
            </Td>
            <Td>task, creator, refunded_lamports</Td>
            <Td>cancel_task</Td>
          </Tr>
          <Tr>
            <Td>
              <InlineCode>TaskExpired</InlineCode>
            </Td>
            <Td>task, creator, refunded_lamports</Td>
            <Td>expire_task</Td>
          </Tr>
        </tbody>
      </Table>

      <H3 id="template-events">Template Events</H3>
      <Table>
        <Thead>
          <Tr>
            <Th>Event</Th>
            <Th>Fields</Th>
            <Th>Emitted By</Th>
          </Tr>
        </Thead>
        <tbody>
          <Tr>
            <Td>
              <InlineCode>TemplateCreated</InlineCode>
            </Td>
            <Td>template, creator, template_index, category</Td>
            <Td>create_template</Td>
          </Tr>
        </tbody>
      </Table>

      <H3 id="dispute-events">Dispute Events</H3>
      <Table>
        <Thead>
          <Tr>
            <Th>Event</Th>
            <Th>Fields</Th>
            <Th>Emitted By</Th>
          </Tr>
        </Thead>
        <tbody>
          <Tr>
            <Td>
              <InlineCode>DisputeOpened</InlineCode>
            </Td>
            <Td>dispute, task, initiator, reason</Td>
            <Td>open_dispute</Td>
          </Tr>
          <Tr>
            <Td>
              <InlineCode>VoteCast</InlineCode>
            </Td>
            <Td>dispute, voter, ruling</Td>
            <Td>cast_vote</Td>
          </Tr>
          <Tr>
            <Td>
              <InlineCode>DisputeResolved</InlineCode>
            </Td>
            <Td>dispute, task, ruling, total_votes</Td>
            <Td>resolve_dispute</Td>
          </Tr>
        </tbody>
      </Table>

      <H3 id="agent-events">Agent Events</H3>
      <Table>
        <Thead>
          <Tr>
            <Th>Event</Th>
            <Th>Fields</Th>
            <Th>Emitted By</Th>
          </Tr>
        </Thead>
        <tbody>
          <Tr>
            <Td>
              <InlineCode>AgentRegistered</InlineCode>
            </Td>
            <Td>agent, profile</Td>
            <Td>register_agent</Td>
          </Tr>
          <Tr>
            <Td>
              <InlineCode>AgentProfileUpdated</InlineCode>
            </Td>
            <Td>agent, reputation_score, tasks_completed</Td>
            <Td>approve_deliverable (internal)</Td>
          </Tr>
        </tbody>
      </Table>

      <H2 id="indexing">Indexing Strategies</H2>
      <p className="mt-4 leading-7">
        There are several approaches to building a queryable history from these events:
      </p>

      <H3 id="anchor-listener">Real-Time (Anchor Listener)</H3>
      <p className="mt-2 leading-7">
        Use <InlineCode>program.addEventListener</InlineCode> for in-browser live updates. Suitable
        for dashboards and notification UIs.
      </p>
      <CodeBlock>{`const id = program.addEventListener('TaskCreated', (event) => {
  // Update UI state
});
// Clean up
program.removeEventListener(id);`}</CodeBlock>

      <H3 id="transaction-log-parsing">Historical (Transaction Logs)</H3>
      <p className="mt-2 leading-7">
        Parse Anchor events from <InlineCode>getTransaction</InlineCode> log messages for
        back-filling history.
      </p>
      <CodeBlock>{`import { BorshCoder, EventParser } from '@coral-xyz/anchor';

const coder = new BorshCoder(idl);
const parser = new EventParser(programId, coder);

const tx = await connection.getTransaction(sig, {
  commitment: 'confirmed',
});
const events = parser.parseLogs(tx.meta.logMessages);
for (const event of events) {
  console.log(event.name, event.data);
}`}</CodeBlock>

      <H3 id="dedicated-indexer">Production (Dedicated Indexer)</H3>
      <p className="mt-2 leading-7">
        For production applications, consider a dedicated indexer service:
      </p>
      <ul className="mt-2 ml-6 list-disc space-y-1 leading-7">
        <li>
          <strong>Helius webhooks</strong> — receive parsed events via HTTP callbacks
        </li>
        <li>
          <strong>Shyft gRPC</strong> — stream all program transactions in real time
        </li>
        <li>
          <strong>Custom geyser plugin</strong> — lowest-latency option for self-hosted
          infrastructure
        </li>
      </ul>
      <Callout type="info">
        All events include the relevant PDA public key so you can join events back to on-chain
        account data without additional lookups.
      </Callout>
    </DocContent>
  )
}
