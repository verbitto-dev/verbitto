import type { Metadata } from 'next'

import { DocContent } from '@/components/doc-content'
import { Callout, H2, H3, InlineCode, Table, Td, Th, Thead, Tr } from '@/components/doc-primitives'

export const metadata: Metadata = {
  title: 'Platform API — Verbitto Docs',
  description: 'Platform management instructions for Verbitto.',
}

const toc = [
  { id: 'initialize-platform', title: 'initialize_platform', depth: 2 },
  { id: 'update-platform', title: 'update_platform', depth: 2 },
  { id: 'pause-platform', title: 'pause_platform', depth: 2 },
  { id: 'resume-platform', title: 'resume_platform', depth: 2 },
]

export default function PlatformApiPage() {
  return (
    <DocContent
      title="Platform API"
      description="Instructions for initializing and managing the Verbitto platform."
      toc={toc}
    >
      <H2 id="initialize-platform">initialize_platform</H2>
      <p className="mt-4 leading-7">
        Initializes the singleton Platform PDA with configuration parameters. Can only be called
        once per program deployment. The signer becomes the platform authority.
      </p>
      <H3 id="init-params">Parameters</H3>
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
              <InlineCode>fee_bps</InlineCode>
            </Td>
            <Td>u16</Td>
            <Td>Platform fee in basis points (max 5000 = 50%)</Td>
          </Tr>
          <Tr>
            <Td>
              <InlineCode>min_bounty_lamports</InlineCode>
            </Td>
            <Td>u64</Td>
            <Td>Minimum task bounty in lamports</Td>
          </Tr>
          <Tr>
            <Td>
              <InlineCode>dispute_voting_period</InlineCode>
            </Td>
            <Td>i64</Td>
            <Td>Voting window in seconds</Td>
          </Tr>
          <Tr>
            <Td>
              <InlineCode>dispute_min_votes</InlineCode>
            </Td>
            <Td>u8</Td>
            <Td>Minimum votes to resolve a dispute</Td>
          </Tr>
          <Tr>
            <Td>
              <InlineCode>min_voter_reputation</InlineCode>
            </Td>
            <Td>i64</Td>
            <Td>Minimum reputation score to vote on disputes</Td>
          </Tr>
          <Tr>
            <Td>
              <InlineCode>claim_grace_period</InlineCode>
            </Td>
            <Td>i64</Td>
            <Td>Grace period (seconds) after deadline for claimed tasks</Td>
          </Tr>
        </tbody>
      </Table>
      <H3 id="init-accounts">Accounts</H3>
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
              <InlineCode>authority</InlineCode>
            </Td>
            <Td>Yes</Td>
            <Td>Yes</Td>
            <Td>Platform admin (pays for PDA rent)</Td>
          </Tr>
          <Tr>
            <Td>
              <InlineCode>platform</InlineCode>
            </Td>
            <Td>No</Td>
            <Td>Yes</Td>
            <Td>Platform PDA (init)</Td>
          </Tr>
          <Tr>
            <Td>
              <InlineCode>treasury</InlineCode>
            </Td>
            <Td>No</Td>
            <Td>No</Td>
            <Td>Fee recipient wallet</Td>
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
      <H3 id="init-errors">Errors</H3>
      <ul className="mt-2 ml-6 list-disc space-y-1 leading-7">
        <li>
          <InlineCode>InvalidFee</InlineCode> — fee_bps &gt; 5000
        </li>
        <li>
          <InlineCode>InvalidConfig</InlineCode> — invalid configuration values
        </li>
      </ul>

      <H2 id="update-platform">update_platform</H2>
      <p className="mt-4 leading-7">
        Allows the authority to update platform configuration parameters after initialization.
      </p>
      <H3 id="update-params">Parameters</H3>
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
              <InlineCode>fee_bps</InlineCode>
            </Td>
            <Td>u16</Td>
            <Td>New platform fee</Td>
          </Tr>
          <Tr>
            <Td>
              <InlineCode>min_bounty_lamports</InlineCode>
            </Td>
            <Td>u64</Td>
            <Td>New minimum bounty</Td>
          </Tr>
          <Tr>
            <Td>
              <InlineCode>dispute_voting_period</InlineCode>
            </Td>
            <Td>i64</Td>
            <Td>New voting period</Td>
          </Tr>
          <Tr>
            <Td>
              <InlineCode>dispute_min_votes</InlineCode>
            </Td>
            <Td>u8</Td>
            <Td>New minimum vote count</Td>
          </Tr>
          <Tr>
            <Td>
              <InlineCode>min_voter_reputation</InlineCode>
            </Td>
            <Td>i64</Td>
            <Td>New reputation threshold</Td>
          </Tr>
        </tbody>
      </Table>
      <H3 id="update-accounts">Accounts</H3>
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
              <InlineCode>authority</InlineCode>
            </Td>
            <Td>Yes</Td>
            <Td>No</Td>
            <Td>Platform admin (must match platform.authority)</Td>
          </Tr>
          <Tr>
            <Td>
              <InlineCode>platform</InlineCode>
            </Td>
            <Td>No</Td>
            <Td>Yes</Td>
            <Td>Platform PDA</Td>
          </Tr>
          <Tr>
            <Td>
              <InlineCode>treasury</InlineCode>
            </Td>
            <Td>No</Td>
            <Td>No</Td>
            <Td>New treasury (optional)</Td>
          </Tr>
        </tbody>
      </Table>

      <H2 id="pause-platform">pause_platform</H2>
      <p className="mt-4 leading-7">
        Emergency pause — sets <InlineCode>is_paused = true</InlineCode> on the Platform PDA. While
        paused, all user-facing instructions (task creation, claiming, submission, etc.) will fail.
      </p>
      <Callout type="warning" title="Admin Only">
        Only the platform authority can pause and resume. Admin instructions (update, pause, resume)
        are <strong>not</strong> affected by the pause state.
      </Callout>
      <H3 id="pause-accounts">Accounts</H3>
      <Table>
        <Thead>
          <Tr>
            <Th>Account</Th>
            <Th>Signer</Th>
            <Th>Writable</Th>
          </Tr>
        </Thead>
        <tbody>
          <Tr>
            <Td>
              <InlineCode>authority</InlineCode>
            </Td>
            <Td>Yes</Td>
            <Td>No</Td>
          </Tr>
          <Tr>
            <Td>
              <InlineCode>platform</InlineCode>
            </Td>
            <Td>No</Td>
            <Td>Yes</Td>
          </Tr>
        </tbody>
      </Table>
      <H3 id="pause-errors">Errors</H3>
      <ul className="mt-2 ml-6 list-disc space-y-1 leading-7">
        <li>
          <InlineCode>PlatformAlreadyPaused</InlineCode> — already paused
        </li>
      </ul>

      <H2 id="resume-platform">resume_platform</H2>
      <p className="mt-4 leading-7">
        Resumes the platform after a pause — sets <InlineCode>is_paused = false</InlineCode>.
      </p>
      <H3 id="resume-accounts">Accounts</H3>
      <Table>
        <Thead>
          <Tr>
            <Th>Account</Th>
            <Th>Signer</Th>
            <Th>Writable</Th>
          </Tr>
        </Thead>
        <tbody>
          <Tr>
            <Td>
              <InlineCode>authority</InlineCode>
            </Td>
            <Td>Yes</Td>
            <Td>No</Td>
          </Tr>
          <Tr>
            <Td>
              <InlineCode>platform</InlineCode>
            </Td>
            <Td>No</Td>
            <Td>Yes</Td>
          </Tr>
        </tbody>
      </Table>
      <H3 id="resume-errors">Errors</H3>
      <ul className="mt-2 ml-6 list-disc space-y-1 leading-7">
        <li>
          <InlineCode>PlatformNotPaused</InlineCode> — not currently paused
        </li>
      </ul>
    </DocContent>
  )
}
