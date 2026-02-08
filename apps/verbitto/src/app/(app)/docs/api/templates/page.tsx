import type { Metadata } from 'next';

import { DocContent } from '@/components/doc-content';
import {
  H2,
  H3,
  InlineCode,
  Table,
  Thead,
  Tr,
  Th,
  Td,
} from '@/components/doc-primitives';

export const metadata: Metadata = {
  title: 'Templates API — VERBITTO Docs',
  description: 'Task template instructions for VERBITTO.',
};

const toc = [
  { id: 'overview', title: 'Overview', depth: 2 },
  { id: 'create-template', title: 'create_template', depth: 2 },
  { id: 'deactivate-template', title: 'deactivate_template', depth: 2 },
  { id: 'task-categories', title: 'Task Categories', depth: 2 },
];

export default function TemplatesApiPage() {
  return (
    <DocContent
      title="Templates API"
      description="Create and manage reusable task templates."
      toc={toc}
    >
      <H2 id="overview">Overview</H2>
      <p className="mt-4 leading-7">
        Task templates allow creators to define reusable configurations with
        pre-filled categories, default bounties, and suggested deadlines. Tasks
        created from templates inherit these defaults but can override them.
      </p>

      <H2 id="create-template">create_template</H2>
      <p className="mt-4 leading-7">
        Creates a new TaskTemplate PDA. Each template is scoped to its creator
        with a sequential index.
      </p>
      <H3 id="template-params">Parameters</H3>
      <Table>
        <Thead>
          <Tr><Th>Parameter</Th><Th>Type</Th><Th>Description</Th></Tr>
        </Thead>
        <tbody>
          <Tr><Td><InlineCode>title</InlineCode></Td><Td>String</Td><Td>Template title</Td></Tr>
          <Tr><Td><InlineCode>description_hash</InlineCode></Td><Td>[u8; 32]</Td><Td>Default description hash</Td></Tr>
          <Tr><Td><InlineCode>category</InlineCode></Td><Td>TaskCategory</Td><Td>Task category</Td></Tr>
          <Tr><Td><InlineCode>default_bounty</InlineCode></Td><Td>u64</Td><Td>Suggested bounty in lamports</Td></Tr>
          <Tr><Td><InlineCode>default_deadline_seconds</InlineCode></Td><Td>i64</Td><Td>Suggested duration in seconds</Td></Tr>
          <Tr><Td><InlineCode>template_index</InlineCode></Td><Td>u64</Td><Td>Sequential index per creator</Td></Tr>
        </tbody>
      </Table>
      <H3 id="create-accounts">Accounts</H3>
      <Table>
        <Thead>
          <Tr><Th>Account</Th><Th>Signer</Th><Th>Writable</Th><Th>Description</Th></Tr>
        </Thead>
        <tbody>
          <Tr><Td><InlineCode>creator</InlineCode></Td><Td>Yes</Td><Td>Yes</Td><Td>Template creator (pays rent)</Td></Tr>
          <Tr><Td><InlineCode>template</InlineCode></Td><Td>No</Td><Td>Yes</Td><Td>TaskTemplate PDA (init)</Td></Tr>
          <Tr><Td><InlineCode>platform</InlineCode></Td><Td>No</Td><Td>No</Td><Td>Platform PDA (pause check)</Td></Tr>
          <Tr><Td><InlineCode>system_program</InlineCode></Td><Td>No</Td><Td>No</Td><Td>System Program</Td></Tr>
        </tbody>
      </Table>
      <p className="mt-2 leading-7">Emits <InlineCode>TemplateCreated</InlineCode>.</p>

      <H2 id="deactivate-template">deactivate_template</H2>
      <p className="mt-4 leading-7">
        Sets <InlineCode>is_active = false</InlineCode> on a template. Tasks
        can no longer be created from inactive templates.
      </p>
      <H3 id="deactivate-accounts">Accounts</H3>
      <Table>
        <Thead>
          <Tr><Th>Account</Th><Th>Signer</Th><Th>Writable</Th><Th>Description</Th></Tr>
        </Thead>
        <tbody>
          <Tr><Td><InlineCode>creator</InlineCode></Td><Td>Yes</Td><Td>No</Td><Td>Must match template.creator</Td></Tr>
          <Tr><Td><InlineCode>template</InlineCode></Td><Td>No</Td><Td>Yes</Td><Td>TaskTemplate PDA</Td></Tr>
        </tbody>
      </Table>
      <H3 id="deactivate-errors">Errors</H3>
      <ul className="mt-2 ml-6 list-disc space-y-1 leading-7">
        <li><InlineCode>NotTaskCreator</InlineCode> — caller is not the template creator</li>
        <li><InlineCode>TemplateInactive</InlineCode> — template is already inactive</li>
      </ul>

      <H2 id="task-categories">Task Categories</H2>
      <Table>
        <Thead>
          <Tr><Th>Category</Th><Th>Description</Th></Tr>
        </Thead>
        <tbody>
          <Tr><Td><InlineCode>DataLabeling</InlineCode></Td><Td>Data annotation and labeling tasks</Td></Tr>
          <Tr><Td><InlineCode>LiteratureReview</InlineCode></Td><Td>Academic or technical literature reviews</Td></Tr>
          <Tr><Td><InlineCode>CodeReview</InlineCode></Td><Td>Source code review and audit</Td></Tr>
          <Tr><Td><InlineCode>Translation</InlineCode></Td><Td>Language translation tasks</Td></Tr>
          <Tr><Td><InlineCode>Analysis</InlineCode></Td><Td>Data or domain analysis</Td></Tr>
          <Tr><Td><InlineCode>Research</InlineCode></Td><Td>Research and investigation</Td></Tr>
          <Tr><Td><InlineCode>Other</InlineCode></Td><Td>Miscellaneous tasks</Td></Tr>
        </tbody>
      </Table>
    </DocContent>
  );
}
