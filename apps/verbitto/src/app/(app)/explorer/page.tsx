import type { Metadata } from 'next';

import { ExplorerStats } from '@/components/explorer-stats';
import { SiteFooter } from '@/components/site-footer';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Explorer',
  description: 'Browse VERBITTO platform activity on Solana.',
};

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

        <ExplorerStats />
      </div>

      <SiteFooter />
    </>
  );
}
