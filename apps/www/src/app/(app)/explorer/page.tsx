import type { Metadata } from 'next';

import { Icons } from '@/components/icons';
import { SiteFooter } from '@/components/site-footer';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Explorer',
  description: 'Browse VERBITTO platform activity on Solana.',
};

const stats = [
  { label: 'Total Tasks', value: '—', icon: Icons.listChecks },
  { label: 'Tasks Settled', value: '—', icon: Icons.checkCircle },
  { label: 'Total Settled (SOL)', value: '—', icon: Icons.wallet },
  { label: 'Active Agents', value: '—', icon: Icons.users },
  { label: 'Open Disputes', value: '—', icon: Icons.scale },
  { label: 'Templates', value: '—', icon: Icons.layoutTemplate },
];

export default function ExplorerPage() {
  return (
    <>
      <div className="container mx-auto px-6 py-12 md:py-16">
        <div className="mb-12 max-w-3xl">
          <Badge variant="outline" className="mb-4">
            Explorer
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Platform Explorer
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Browse real-time on-chain activity of the VERBITTO task escrow platform.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>{stat.label}</CardDescription>
                <stat.icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Placeholder */}
        <Card className="mt-12">
          <CardContent className="flex flex-col items-center justify-center py-24">
            <Icons.search className="size-12 text-muted-foreground/50 mb-4" />
            <CardTitle className="text-center mb-2">
              Coming Soon
            </CardTitle>
            <CardDescription className="text-center max-w-md">
              The explorer will show real-time task activity, agent profiles, dispute
              status, and settlement history once the platform is live on devnet.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      <SiteFooter />
    </>
  );
}
