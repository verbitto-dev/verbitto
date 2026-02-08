'use client';

import { Icons } from '@/components/icons';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { lamportsToSol, usePlatform, useTasks } from '@/hooks/use-program';

export function ExplorerStats() {
  const { platform, loading: pLoading } = usePlatform();
  const { tasks, loading: tLoading } = useTasks();

  const loading = pLoading || tLoading;

  const openTasks = tasks.filter((t) => t.status === 'Open').length;
  const settledTasks = tasks.filter(
    (t) => t.status === 'Approved',
  ).length;
  const disputedTasks = tasks.filter(
    (t) => t.status === 'Disputed',
  ).length;

  const stats = [
    {
      label: 'Total Tasks',
      value: loading ? '—' : String(platform?.taskCount ?? tasks.length),
      icon: Icons.listChecks,
    },
    {
      label: 'Tasks Settled',
      value: loading ? '—' : String(settledTasks),
      icon: Icons.checkCircle,
    },
    {
      label: 'Total Settled (SOL)',
      value: loading
        ? '—'
        : platform
          ? lamportsToSol(platform.totalSettledLamports)
          : '0',
      icon: Icons.wallet,
    },
    {
      label: 'Open Tasks',
      value: loading ? '—' : String(openTasks),
      icon: Icons.zap,
    },
    {
      label: 'Open Disputes',
      value: loading ? '—' : String(disputedTasks),
      icon: Icons.scale,
    },
    {
      label: 'Templates',
      value: loading
        ? '—'
        : String(platform?.templateCount ?? 0),
      icon: Icons.layoutTemplate,
    },
  ];

  return (
    <>
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

      {/* Platform config */}
      {platform && (
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>Platform Configuration</CardTitle>
            <CardDescription>
              Live on-chain platform parameters (devnet)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody className="divide-y">
                  {[
                    ['Fee Rate', `${platform.feeBps / 100}%`],
                    [
                      'Min Bounty',
                      `${lamportsToSol(platform.minBountyLamports)} SOL`,
                    ],
                    ['Dispute Voting Period', `${platform.disputeVotingPeriod}s`],
                    ['Min Votes to Resolve', String(platform.disputeMinVotes)],
                    [
                      'Min Voter Reputation',
                      String(platform.minVoterReputation),
                    ],
                    ['Claim Grace Period', `${platform.claimGracePeriod}s`],
                    ['Paused', platform.isPaused ? 'Yes' : 'No'],
                  ].map(([label, value]) => (
                    <tr key={label}>
                      <td className="py-2 text-muted-foreground">{label}</td>
                      <td className="py-2 font-medium text-right">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!loading && !platform && (
        <Card className="mt-12">
          <CardContent className="flex flex-col items-center justify-center py-24">
            <Icons.search className="size-12 text-muted-foreground/50 mb-4" />
            <CardTitle className="text-center mb-2">
              Platform Not Initialized
            </CardTitle>
            <CardDescription className="text-center max-w-md">
              The VERBITTO platform has not been initialized on devnet yet.
              Deploy the program and run initialize_platform to see live stats.
            </CardDescription>
          </CardContent>
        </Card>
      )}
    </>
  );
}
