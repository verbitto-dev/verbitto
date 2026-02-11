'use client'

import Link from 'next/link'
import { Icons } from '@/components/icons'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { lamportsToSol, useIndexerStats, usePlatform, useTasks } from '@/hooks/use-program'

export function ExplorerStats() {
  const { platform, loading: pLoading } = usePlatform()
  const { tasks, loading: tLoading } = useTasks()
  const { stats: ixStats } = useIndexerStats()

  const loading = pLoading || tLoading

  const openTasks = tasks.filter((t) => t.status === 'Open').length
  const activeTasks = tasks.length
  const disputedTasks = tasks.filter((t) => t.status === 'Disputed').length
  const settledCount = ixStats?.approvedCount ?? 0
  const _cancelledCount = ixStats?.cancelledCount ?? 0

  const stats = [
    {
      label: 'Tasks Created',
      value: loading ? '—' : String(platform?.taskCount ?? 0),
      icon: Icons.listChecks,
      href: '/tasks',
      description: 'Cumulative tasks created',
    },
    {
      label: 'Active Tasks',
      value: loading ? '—' : String(activeTasks),
      icon: Icons.zap,
      href: '/tasks',
      description: 'Tasks currently on-chain',
    },
    {
      label: 'Tasks Settled',
      value: loading ? '—' : String(settledCount),
      icon: Icons.checkCircle,
      href: '/tasks?status=Approved',
      description: 'Completed & settled',
    },
    {
      label: 'Total Settled (SOL)',
      value: loading ? '—' : platform ? lamportsToSol(platform.totalSettledLamports) : '0',
      icon: Icons.wallet,
      href: '/tasks',
      description: 'Cumulative settled volume',
    },
    {
      label: 'Open Tasks',
      value: loading ? '—' : String(openTasks),
      icon: Icons.checkCircle,
      href: '/tasks?status=Open',
      description: 'Awaiting claims',
    },
    {
      label: 'Open Disputes',
      value: loading ? '—' : String(disputedTasks),
      icon: Icons.scale,
      href: '/tasks?status=Disputed',
      description: 'Under arbitration',
    },
    /* {
      label: 'Templates',
      value: loading ? '—' : String(platform?.templateCount ?? 0),
      icon: Icons.layoutTemplate,
      href: '/tasks?template=true',
      description: 'View templates',
    }, */
  ]

  return (
    <>
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="no-underline">
            <Card className="group hover:border-brand/40 transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="group-hover:text-foreground transition-colors">
                  {stat.label}
                </CardDescription>
                <stat.icon className="size-4 text-muted-foreground group-hover:text-brand transition-colors" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold group-hover:text-brand transition-colors">
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground mt-2">{stat.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Platform config */}
      {platform && (
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>Platform Configuration</CardTitle>
            <CardDescription>Live on-chain platform parameters (devnet)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody className="divide-y">
                  {[
                    ['Fee Rate', `${platform.feeBps / 100}%`],
                    ['Min Bounty', `${lamportsToSol(platform.minBountyLamports)} SOL`],
                    ['Dispute Voting Period', `${platform.disputeVotingPeriod}s`],
                    ['Min Votes to Resolve', String(platform.disputeMinVotes)],
                    ['Min Voter Reputation', String(platform.minVoterReputation)],
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
            <CardTitle className="text-center mb-2">Platform Not Initialized</CardTitle>
            <CardDescription className="text-center max-w-md">
              The Verbitto platform has not been initialized on devnet yet. Deploy the program and
              run initialize_platform to see live stats.
            </CardDescription>
          </CardContent>
        </Card>
      )}
    </>
  )
}
