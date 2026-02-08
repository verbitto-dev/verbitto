import type { Metadata } from 'next';

import { DocContent } from '@/components/doc-content';
import {
  H2,
  InlineCode,
  Table,
  Thead,
  Tr,
  Th,
  Td,
  Callout,
  CodeBlock,
} from '@/components/doc-primitives';

export const metadata: Metadata = {
  title: 'Error Handling — VERBITTO Docs',
  description: 'Complete error code reference for the VERBITTO program.',
};

const toc = [
  { id: 'overview', title: 'Overview', depth: 2 },
  { id: 'error-codes', title: 'Error Code Table', depth: 2 },
  { id: 'client-handling', title: 'Client-Side Handling', depth: 2 },
];

const errors = [
  { name: 'InvalidFee', code: 6000, msg: 'Fee basis points must be ≤ 5000 (50%)' },
  { name: 'InvalidConfig', code: 6001, msg: 'Invalid platform configuration' },
  { name: 'BountyTooLow', code: 6002, msg: 'Bounty is below the platform minimum' },
  { name: 'TitleTooLong', code: 6003, msg: 'Title exceeds 64 characters' },
  { name: 'DeadlineInPast', code: 6004, msg: 'Deadline must be in the future' },
  { name: 'InvalidRepReward', code: 6005, msg: 'Reputation reward must be 0–1000' },
  { name: 'TaskNotOpen', code: 6006, msg: 'Task is not in Open status' },
  { name: 'TaskExpired', code: 6007, msg: 'Task has passed its deadline' },
  { name: 'TaskNotClaimedOrRejected', code: 6008, msg: 'Task is not in Claimed or Rejected status' },
  { name: 'NotAssignedAgent', code: 6009, msg: 'Caller is not the assigned agent' },
  { name: 'TaskNotSubmitted', code: 6010, msg: 'Task is not in Submitted status' },
  { name: 'NotTaskCreator', code: 6011, msg: 'Caller is not the task creator' },
  { name: 'DeadlineNotReached', code: 6012, msg: 'Deadline has not been reached yet' },
  { name: 'TaskCannotExpire', code: 6013, msg: 'Task cannot be expired in its current status' },
  { name: 'TemplateInactive', code: 6014, msg: 'Template is not active' },
  { name: 'TaskNotDisputable', code: 6015, msg: 'Task is not in a disputable status' },
  { name: 'NotTaskParty', code: 6016, msg: 'Caller is not a party to this task' },
  { name: 'DisputeNotOpen', code: 6017, msg: 'Dispute is not open' },
  { name: 'TaskNotDisputed', code: 6018, msg: 'Task is not in Disputed status' },
  { name: 'InvalidRuling', code: 6019, msg: 'Invalid ruling value' },
  { name: 'VotingPeriodEnded', code: 6020, msg: 'Voting period has ended' },
  { name: 'VotingPeriodNotEnded', code: 6021, msg: 'Voting period has not ended yet' },
  { name: 'PartyCannotVote', code: 6022, msg: 'Task parties cannot vote on their own dispute' },
  { name: 'InsufficientVotes', code: 6023, msg: 'Insufficient votes to resolve dispute' },
  { name: 'DisputeTaskMismatch', code: 6024, msg: 'Dispute does not reference this task' },
  { name: 'InvalidTreasury', code: 6025, msg: 'Treasury account does not match platform config' },
  { name: 'NotProfileOwner', code: 6026, msg: 'Caller is not the profile owner' },
  { name: 'InsufficientReputation', code: 6027, msg: 'Voter reputation is below the minimum required to vote' },
  { name: 'PlatformPaused', code: 6028, msg: 'Platform is paused' },
  { name: 'PlatformAlreadyPaused', code: 6029, msg: 'Platform is already paused' },
  { name: 'PlatformNotPaused', code: 6030, msg: 'Platform is not paused' },
  { name: 'NotPlatformAuthority', code: 6031, msg: 'Caller is not the platform authority' },
  { name: 'ArithmeticOverflow', code: 6032, msg: 'Arithmetic overflow in calculation' },
  { name: 'MaxRejectionsReached', code: 6033, msg: 'Maximum rejection limit reached — task auto-disputed' },
  { name: 'InvalidTaskIndex', code: 6034, msg: 'Task index does not match creator counter' },
];

export default function ErrorsGuidePage() {
  return (
    <DocContent
      title="Error Handling"
      description="Complete error code reference and client-side handling patterns."
      toc={toc}
    >
      <H2 id="overview">Overview</H2>
      <p className="mt-4 leading-7">
        The VERBITTO program defines <strong>{errors.length}</strong> custom
        error codes under the <InlineCode>VerbittoError</InlineCode> enum.
        Anchor assigns each variant a numeric code starting at 6000.
      </p>

      <H2 id="error-codes">Error Code Table</H2>
      <Table>
        <Thead>
          <Tr>
            <Th>Code</Th>
            <Th>Name</Th>
            <Th>Message</Th>
          </Tr>
        </Thead>
        <tbody>
          {errors.map((e) => (
            <Tr key={e.code}>
              <Td><InlineCode>{e.code}</InlineCode></Td>
              <Td><InlineCode>{e.name}</InlineCode></Td>
              <Td>{e.msg}</Td>
            </Tr>
          ))}
        </tbody>
      </Table>

      <H2 id="client-handling">Client-Side Handling</H2>
      <p className="mt-4 leading-7">
        Anchor wraps program errors in an <InlineCode>AnchorError</InlineCode>.
        Parse them on the client to display user-friendly messages.
      </p>
      <CodeBlock title="Error handling pattern">{`import { AnchorError } from '@coral-xyz/anchor';

try {
  await program.methods.claimTask().accounts({ ... }).rpc();
} catch (err) {
  if (err instanceof AnchorError) {
    switch (err.error.errorCode.code) {
      case 'TaskNotOpen':
        toast.error('This task is no longer available.');
        break;
      case 'PlatformPaused':
        toast.error('Platform is paused. Try again later.');
        break;
      default:
        toast.error(err.error.errorMessage);
    }
  } else {
    // Wallet rejection, network error, etc.
    toast.error('Transaction failed. Please try again.');
  }
}`}</CodeBlock>
      <Callout type="info">
        The <InlineCode>errorCode.code</InlineCode> field is the string variant
        name (e.g., &quot;TaskNotOpen&quot;), while{' '}
        <InlineCode>errorCode.number</InlineCode> is the numeric code (e.g.,
        6006).
      </Callout>
    </DocContent>
  );
}
