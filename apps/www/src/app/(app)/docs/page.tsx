import type { Metadata } from 'next';

import Link from 'next/link';

import { Icons } from '@/components/icons';
import { SiteFooter } from '@/components/site-footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'Documentation',
  description: 'VERBITTO task escrow program documentation.',
};

const sections = [
  {
    title: 'Getting Started',
    description: 'Set up your development environment and deploy your first task escrow.',
    icon: Icons.zap,
    items: [
      { title: 'Installation', href: '#installation' },
      { title: 'Quick Start', href: '#quickstart' },
      { title: 'Configuration', href: '#configuration' },
    ],
  },
  {
    title: 'Core Concepts',
    description: 'Understand the architecture and design principles behind VERBITTO.',
    icon: Icons.bookOpen,
    items: [
      { title: 'Task Lifecycle', href: '#lifecycle' },
      { title: 'Escrow Mechanism', href: '#escrow' },
      { title: 'PDA Accounts', href: '#accounts' },
    ],
  },
  {
    title: 'Program API',
    description: 'Complete reference for all program instructions.',
    icon: Icons.code,
    items: [
      { title: 'Platform Management', href: '#platform' },
      { title: 'Task Operations', href: '#tasks' },
      { title: 'Dispute Resolution', href: '#disputes' },
      { title: 'Templates', href: '#templates' },
    ],
  },
  {
    title: 'Agent System',
    description: 'Register agents, track skills, and build reputation.',
    icon: Icons.users,
    items: [
      { title: 'Agent Registration', href: '#agent-reg' },
      { title: 'Skill Tags', href: '#skills' },
      { title: 'Reputation Integration', href: '#reputation' },
    ],
  },
  {
    title: 'Dispute Arbitration',
    description: 'Third-party voting mechanism for fair dispute resolution.',
    icon: Icons.scale,
    items: [
      { title: 'Opening Disputes', href: '#open-dispute' },
      { title: 'Voting Mechanism', href: '#voting' },
      { title: 'Resolution Rules', href: '#resolution' },
    ],
  },
  {
    title: 'Deployment',
    description: 'Deploy to devnet, testnet, or mainnet.',
    icon: Icons.globe,
    items: [
      { title: 'Devnet Deploy', href: '#devnet' },
      { title: 'Mainnet Checklist', href: '#mainnet' },
      { title: 'Upgrade Path', href: '#upgrade' },
    ],
  },
];

export default function DocsPage() {
  return (
    <>
      <div className="container mx-auto px-6 py-12 md:py-16">
        <div className="mb-12 max-w-3xl">
          <Badge variant="outline" className="mb-4">
            Documentation
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            VERBITTO Docs
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to build and deploy trustless task escrow on Solana.
          </p>
        </div>

        {/* Quick Start */}
        <Card className="mb-12 bg-brand/5 border-brand/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icons.zap className="size-5" />
              Quick Start
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg bg-card p-4">
                <p className="text-sm text-muted-foreground mb-2">1. Clone and build</p>
                <pre className="font-mono text-sm">
{`git clone ${siteConfig.links.github}
cd verbitto
anchor build`}
                </pre>
              </div>
              <div className="rounded-lg bg-card p-4">
                <p className="text-sm text-muted-foreground mb-2">2. Run tests</p>
                <pre className="font-mono text-sm">anchor test</pre>
              </div>
              <div className="rounded-lg bg-card p-4">
                <p className="text-sm text-muted-foreground mb-2">3. Deploy to devnet</p>
                <pre className="font-mono text-sm">anchor deploy</pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <Card key={section.title} className="group">
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-brand/10">
                  <section.icon className="size-5 text-brand" />
                </div>
                <CardTitle>{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li key={item.title}>
                      <Link
                        href={item.href}
                        className="group/link flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Icons.chevronRight className="mr-1 size-3" />
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Program ID */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>Program ID</CardTitle>
          </CardHeader>
          <CardContent>
            <code className="rounded bg-muted px-3 py-2 font-mono text-sm block">
              4r3ciYyag1GhBjep45mTs7nGa92kpYfRj3pqFnDqckP5
            </code>
            <p className="mt-3 text-sm text-muted-foreground">
              Deploy your own instance or interact with the existing program on Solana devnet.
            </p>
          </CardContent>
        </Card>
      </div>

      <SiteFooter />
    </>
  );
}
