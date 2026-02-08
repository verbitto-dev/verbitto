import type { Metadata } from 'next';

import { DocContent } from '@/components/doc-content';
import {
  CodeBlock,
  H2,
  H3,
  InlineCode,
  Callout,
  Steps,
  Step,
  Table,
  Thead,
  Tr,
  Th,
  Td,
} from '@/components/doc-primitives';

export const metadata: Metadata = {
  title: 'Devnet Deployment — VERBITTO Docs',
  description: 'Deploy the VERBITTO program to Solana devnet.',
};

const toc = [
  { id: 'prerequisites', title: 'Prerequisites', depth: 2 },
  { id: 'configure-cluster', title: 'Configure Cluster', depth: 2 },
  { id: 'build-and-deploy', title: 'Build & Deploy', depth: 2 },
  { id: 'initialize-platform', title: 'Initialize Platform', depth: 2 },
  { id: 'verify-deployment', title: 'Verify Deployment', depth: 2 },
  { id: 'upgrade-program', title: 'Upgrade Program', depth: 2 },
  { id: 'troubleshooting', title: 'Troubleshooting', depth: 2 },
];

export default function DevnetDeploymentPage() {
  return (
    <DocContent
      title="Devnet Deployment"
      description="Step-by-step guide to deploy VERBITTO on Solana devnet."
      toc={toc}
    >
      <H2 id="prerequisites">Prerequisites</H2>
      <ul className="mt-4 ml-6 list-disc space-y-1 leading-7">
        <li>Solana CLI ≥ 1.18</li>
        <li>Anchor CLI 0.30.1</li>
        <li>A funded devnet keypair</li>
      </ul>

      <H2 id="configure-cluster">Configure Cluster</H2>
      <Steps>
        <Step title="Set devnet as default">
          <CodeBlock>{`solana config set --url devnet`}</CodeBlock>
        </Step>
        <Step title="Generate or use an existing keypair">
          <CodeBlock>{`solana-keygen new --outfile ~/.config/solana/devnet.json
solana config set --keypair ~/.config/solana/devnet.json`}</CodeBlock>
        </Step>
        <Step title="Fund your wallet">
          <CodeBlock>{`solana airdrop 2`}</CodeBlock>
          <p className="mt-2 leading-7">
            Repeat if needed — devnet airdrops are capped at 2 SOL per request.
          </p>
        </Step>
      </Steps>

      <H2 id="build-and-deploy">Build & Deploy</H2>
      <Steps>
        <Step title="Build the program">
          <CodeBlock>{`anchor build`}</CodeBlock>
          <p className="mt-2 leading-7">
            This compiles the program and generates the IDL at{' '}
            <InlineCode>target/idl/task_escrow.json</InlineCode>.
          </p>
        </Step>
        <Step title="Check the program ID">
          <CodeBlock>{`solana address -k target/deploy/task_escrow-keypair.json`}</CodeBlock>
          <p className="mt-2 leading-7">
            Ensure this matches the <InlineCode>declare_id!</InlineCode> in{' '}
            <InlineCode>lib.rs</InlineCode> and{' '}
            <InlineCode>Anchor.toml</InlineCode>.
          </p>
        </Step>
        <Step title="Deploy">
          <CodeBlock>{`anchor deploy --provider.cluster devnet`}</CodeBlock>
          <Callout type="info">
            Deployment costs approximately 3–4 SOL for rent-exempt storage.
            Ensure your wallet has sufficient balance.
          </Callout>
        </Step>
      </Steps>

      <H2 id="initialize-platform">Initialize Platform</H2>
      <p className="mt-4 leading-7">
        After deployment, the Platform PDA must be initialised before any tasks
        can be created.
      </p>
      <CodeBlock title="Initialize via test script">{`anchor test --skip-deploy --provider.cluster devnet`}</CodeBlock>
      <p className="mt-2 leading-7">
        Or call <InlineCode>initialize_platform</InlineCode> directly with your
        deployment keypair as the authority:
      </p>
      <CodeBlock>{`// Example params
feeBps:          250,   // 2.5%
minBounty:       10_000_000, // 0.01 SOL
disputeWindow:   259_200,    // 3 days
votingPeriod:    86_400,     // 1 day
minVotesNeeded:  3,
maxRejections:   3,
gracePeriod:     86_400,     // 1 day
minVoterRep:     100`}</CodeBlock>

      <H2 id="verify-deployment">Verify Deployment</H2>
      <Table>
        <Thead>
          <Tr><Th>Check</Th><Th>Command</Th></Tr>
        </Thead>
        <tbody>
          <Tr>
            <Td>Program exists</Td>
            <Td><InlineCode>solana program show {'<PROGRAM_ID>'}</InlineCode></Td>
          </Tr>
          <Tr>
            <Td>Platform PDA</Td>
            <Td><InlineCode>anchor account task_escrow.Platform {'<PDA>'}</InlineCode></Td>
          </Tr>
          <Tr>
            <Td>IDL uploaded</Td>
            <Td><InlineCode>anchor idl fetch {'<PROGRAM_ID>'} --provider.cluster devnet</InlineCode></Td>
          </Tr>
        </tbody>
      </Table>
      <Callout type="info">
        Upload the IDL on-chain so explorers can parse your transactions:{' '}
        <InlineCode>anchor idl init {'<PROGRAM_ID>'} -f target/idl/task_escrow.json --provider.cluster devnet</InlineCode>
      </Callout>

      <H2 id="upgrade-program">Upgrade Program</H2>
      <p className="mt-4 leading-7">
        To upgrade an existing deployment:
      </p>
      <CodeBlock>{`anchor build
anchor upgrade target/deploy/task_escrow.so \\
  --program-id 4r3ciYyag1GhBjep45mTs7nGa92kpYfRj3pqFnDqckP5 \\
  --provider.cluster devnet`}</CodeBlock>
      <Callout type="warning">
        Only the upgrade authority can upgrade the program. By default this is
        the deploy keypair. Transfer or revoke the upgrade authority for
        production deployments.
      </Callout>

      <H2 id="troubleshooting">Troubleshooting</H2>
      <Table>
        <Thead>
          <Tr><Th>Problem</Th><Th>Solution</Th></Tr>
        </Thead>
        <tbody>
          <Tr>
            <Td>Insufficient funds</Td>
            <Td>Run <InlineCode>solana airdrop 2</InlineCode> (max 2 SOL per request)</Td>
          </Tr>
          <Tr>
            <Td>Program ID mismatch</Td>
            <Td>Update <InlineCode>declare_id!</InlineCode> and Anchor.toml to match the keypair</Td>
          </Tr>
          <Tr>
            <Td>Buffer account too small</Td>
            <Td>Close the buffer and re-deploy: <InlineCode>solana program close --buffers</InlineCode></Td>
          </Tr>
          <Tr>
            <Td>Transaction too large</Td>
            <Td>Use <InlineCode>anchor deploy</InlineCode> which handles chunked writes</Td>
          </Tr>
          <Tr>
            <Td>RPC rate limit</Td>
            <Td>Use a dedicated RPC provider (Helius, QuickNode, Triton)</Td>
          </Tr>
        </tbody>
      </Table>
    </DocContent>
  );
}
