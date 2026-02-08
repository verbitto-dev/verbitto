import type { Metadata } from 'next';

import Link from 'next/link';

import { DocContent } from '@/components/doc-content';
import { H2, InlineCode, Table, Thead, Tr, Th, Td } from '@/components/doc-primitives';
import { Icons } from '@/components/icons';

export const metadata: Metadata = {
  title: 'Program API — Verbitto Docs',
  description: 'Complete instruction reference for the Verbitto Solana program.',
};

const toc = [
  { id: 'overview', title: 'Overview', depth: 2 },
  { id: 'instruction-groups', title: 'Instruction Groups', depth: 2 },
  { id: 'conventions', title: 'Conventions', depth: 2 },
];

const groups = [
  {
    title: 'Platform',
    href: '/docs/api/platform',
    icon: Icons.layers,
    count: 4,
    description: 'Initialize, configure, pause, and resume the platform.',
  },
  {
    title: 'Task',
    href: '/docs/api/task',
    icon: Icons.listChecks,
    count: 7,
    description:
      'Create, claim, submit, approve, reject, cancel, and expire tasks.',
  },
  {
    title: 'Agent',
    href: '/docs/api/agent',
    icon: Icons.users,
    count: 2,
    description: 'Register agents and update skill tags.',
  },
  {
    title: 'Dispute',
    href: '/docs/api/dispute',
    icon: Icons.scale,
    count: 3,
    description: 'Open disputes, cast votes, and resolve outcomes.',
  },
  {
    title: 'Templates',
    href: '/docs/api/templates',
    icon: Icons.layoutTemplate,
    count: 2,
    description: 'Create and deactivate reusable task templates.',
  },
];

export default function ApiOverviewPage() {
  return (
    <DocContent
      title="Program API"
      description="Complete instruction reference for the Verbitto Solana program."
      toc={toc}
    >
      <H2 id="overview">Overview</H2>
      <p className="mt-4 leading-7">
        The Verbitto program exposes <strong>18 instructions</strong> organized
        into 5 groups. All instructions are implemented using Anchor 0.30.1
        with full error handling (no <InlineCode>.unwrap()</InlineCode> calls).
      </p>

      <H2 id="instruction-groups">Instruction Groups</H2>
      <div className="mt-6 grid gap-3">
        {groups.map((group) => (
          <Link
            key={group.title}
            href={group.href}
            className="group flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent"
          >
            <div className="flex size-10 items-center justify-center rounded-lg bg-brand/10">
              <group.icon className="size-5 text-brand" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">
                {group.title}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {group.count} instructions
                </span>
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {group.description}
              </p>
            </div>
            <Icons.chevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </Link>
        ))}
      </div>

      <H2 id="conventions">Conventions</H2>
      <Table>
        <Thead>
          <Tr>
            <Th>Convention</Th>
            <Th>Description</Th>
          </Tr>
        </Thead>
        <tbody>
          <Tr>
            <Td>Error Handling</Td>
            <Td>All arithmetic uses <InlineCode>checked_*</InlineCode> with <InlineCode>ArithmeticOverflow</InlineCode> error</Td>
          </Tr>
          <Tr>
            <Td>Account Closure</Td>
            <Td>Terminal states (Approved, Cancelled, Expired, Resolved) close PDAs and refund rent</Td>
          </Tr>
          <Tr>
            <Td>Pause Guard</Td>
            <Td>All user-facing instructions check <InlineCode>!platform.is_paused</InlineCode></Td>
          </Tr>
          <Tr>
            <Td>Events</Td>
            <Td>Every state change emits an Anchor event for indexing</Td>
          </Tr>
          <Tr>
            <Td>PDA Seeds</Td>
            <Td>u64 indices are serialized as 8-byte little-endian</Td>
          </Tr>
        </tbody>
      </Table>
    </DocContent>
  );
}
