import type { Metadata } from 'next';

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

export const metadata: Metadata = {
  title: 'Tasks',
  description: 'Browse and create tasks on VERBITTO.',
};

const sampleTasks = [
  {
    title: 'Data Labeling — Image Classification',
    bounty: '2.5 SOL',
    status: 'Open',
    statusVariant: 'outline' as const,
    deadline: '7 days',
    skills: 'Data',
  },
  {
    title: 'Smart Contract Audit — Token Bridge',
    bounty: '15 SOL',
    status: 'Claimed',
    statusVariant: 'secondary' as const,
    deadline: '14 days',
    skills: 'Security',
  },
  {
    title: 'Literature Survey — LLM Agents',
    bounty: '5 SOL',
    status: 'Submitted',
    statusVariant: 'default' as const,
    deadline: '3 days',
    skills: 'Research',
  },
  {
    title: 'Code Review — Anchor Program',
    bounty: '8 SOL',
    status: 'Open',
    statusVariant: 'outline' as const,
    deadline: '5 days',
    skills: 'Engineering',
  },
];

export default function TasksPage() {
  return (
    <>
      <div className="container mx-auto px-6 py-12 md:py-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Badge variant="outline" className="mb-4">
              Tasks
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Task Board
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Browse available tasks or create your own with SOL bounties.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mb-8">
          <Button variant="brand" className="rounded-lg">
            <Icons.zap className="mr-1 size-4" />
            Create Task
          </Button>
          <Button variant="outline" className="rounded-lg">
            <Icons.layoutTemplate className="mr-1 size-4" />
            From Template
          </Button>
        </div>

        {/* Task List */}
        <div className="grid gap-4">
          {sampleTasks.map((task) => (
            <Card key={task.title} className="group hover:border-brand/40 transition-colors">
              <CardHeader className="flex flex-row items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base group-hover:text-brand transition-colors">
                    {task.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Icons.wallet className="size-3" />
                      {task.bounty}
                    </span>
                    <span className="flex items-center gap-1">
                      <Icons.clock className="size-3" />
                      {task.deadline}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {task.skills}
                    </Badge>
                  </CardDescription>
                </div>
                <Badge variant={task.statusVariant}>{task.status}</Badge>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Info */}
        <Card className="mt-12">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Icons.lock className="size-12 text-muted-foreground/50 mb-4" />
            <CardTitle className="text-center mb-2">
              Connect Wallet to Interact
            </CardTitle>
            <CardDescription className="text-center max-w-md">
              The task board above shows demo data. Connect a Solana wallet to create,
              claim, and settle real tasks on devnet.
            </CardDescription>
            <Button variant="brand" className="mt-6 rounded-lg">
              <Icons.wallet className="mr-1 size-4" />
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>

      <SiteFooter />
    </>
  );
}
