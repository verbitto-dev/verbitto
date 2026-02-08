import type { Metadata } from 'next';

import { DocContent } from '@/components/doc-content';
import {
  Callout,
  CodeBlock,
  H2,
  H3,
  InlineCode,
  Steps,
  Step,
} from '@/components/doc-primitives';

export const metadata: Metadata = {
  title: 'Installation — Verbitto Docs',
  description: 'Set up your development environment for Verbitto.',
};

const toc = [
  { id: 'prerequisites', title: 'Prerequisites', depth: 2 },
  { id: 'install-rust', title: 'Install Rust', depth: 3 },
  { id: 'install-solana-cli', title: 'Install Solana CLI', depth: 3 },
  { id: 'install-anchor', title: 'Install Anchor', depth: 3 },
  { id: 'clone-the-repository', title: 'Clone the Repository', depth: 2 },
  { id: 'build-the-program', title: 'Build the Program', depth: 2 },
  { id: 'configure-solana', title: 'Configure Solana', depth: 2 },
  { id: 'frontend-setup', title: 'Frontend Setup', depth: 2 },
];

export default function InstallationPage() {
  return (
    <DocContent
      title="Installation"
      description="Set up your development environment with Rust, Solana CLI, and Anchor."
      toc={toc}
    >
      <H2 id="prerequisites">Prerequisites</H2>
      <p className="mt-4 leading-7">
        Verbitto requires the following tools. If you already have them
        installed, skip to{' '}
        <a href="#clone-the-repository" className="font-medium underline underline-offset-4">
          Clone the Repository
        </a>
        .
      </p>

      <H3 id="install-rust">Install Rust</H3>
      <p className="mt-4 leading-7">
        Install Rust via <InlineCode>rustup</InlineCode>. Verbitto requires
        Rust 1.75+.
      </p>
      <CodeBlock title="Terminal">
        {`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
rustc --version`}
      </CodeBlock>

      <H3 id="install-solana-cli">Install Solana CLI</H3>
      <p className="mt-4 leading-7">
        Install the Solana Tool Suite (v1.18+):
      </p>
      <CodeBlock title="Terminal">
        {`sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
solana --version`}
      </CodeBlock>

      <H3 id="install-anchor">Install Anchor</H3>
      <p className="mt-4 leading-7">
        Verbitto uses Anchor 0.30.1. Install via <InlineCode>avm</InlineCode>{' '}
        (Anchor Version Manager):
      </p>
      <CodeBlock title="Terminal">
        {`cargo install --git https://github.com/coral-xyz/anchor avm --force
avm install 0.30.1
avm use 0.30.1
anchor --version`}
      </CodeBlock>

      <H2 id="clone-the-repository">Clone the Repository</H2>
      <CodeBlock title="Terminal">
        {`git clone https://github.com/OpenClaw/verbitto.git
cd verbitto`}
      </CodeBlock>

      <H2 id="build-the-program">Build the Program</H2>
      <CodeBlock title="Terminal">{`anchor build`}</CodeBlock>
      <p className="mt-4 leading-7">
        This compiles the Solana program to{' '}
        <InlineCode>target/deploy/task_escrow.so</InlineCode>. The first build
        may take a few minutes while downloading and compiling dependencies.
      </p>

      <Callout type="info" title="Build Output">
        The compiled program ID is logged during build. It should match the
        declared ID in <InlineCode>lib.rs</InlineCode> and{' '}
        <InlineCode>Anchor.toml</InlineCode>.
      </Callout>

      <H2 id="configure-solana">Configure Solana</H2>
      <p className="mt-4 leading-7">
        Set your Solana CLI to devnet and generate a keypair:
      </p>
      <CodeBlock title="Terminal">
        {`solana config set --url devnet
solana-keygen new --outfile ~/.config/solana/id.json
solana airdrop 2`}
      </CodeBlock>

      <Callout type="warning" title="Security">
        Never share your keypair file. Store it with restricted permissions:{' '}
        <InlineCode>chmod 0600 ~/.config/solana/id.json</InlineCode>.
      </Callout>

      <H2 id="frontend-setup">Frontend Setup</H2>
      <p className="mt-4 leading-7">
        The Verbitto frontend is a Next.js app located in{' '}
        <InlineCode>apps/www</InlineCode>:
      </p>
      <CodeBlock title="Terminal">
        {`cd apps/www
pnpm install
pnpm dev`}
      </CodeBlock>
      <p className="mt-4 leading-7">
        The development server starts at{' '}
        <InlineCode>http://localhost:3000</InlineCode>. It connects to Solana
        devnet by default.
      </p>
    </DocContent>
  );
}
