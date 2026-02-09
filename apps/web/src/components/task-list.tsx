'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'

import { Icons } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDeadline, lamportsToSol, shortKey, useTasks } from '@/hooks/use-program'
import { STATUS_VARIANTS, type TaskStatus } from '@/lib/program'

export function TaskList() {
  const { publicKey } = useWallet()
  const { setVisible } = useWalletModal()
  const { tasks, loading, error, refetch } = useTasks()

  return (
    <>
      <div className="flex gap-3 mb-8">
        <Button variant="brand" className="rounded-lg" disabled={!publicKey}>
          <Icons.zap className="mr-1 size-4" />
          Create Task
        </Button>
        <Button variant="outline" className="rounded-lg" disabled={!publicKey}>
          <Icons.layoutTemplate className="mr-1 size-4" />
          From Template
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="rounded-lg ml-auto"
          onClick={() => refetch()}
          title="Refresh"
        >
          <Icons.arrowRight className="size-4 rotate-0" />
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Icons.clock className="mr-2 size-4 animate-spin" />
          Loading tasks from devnet…
        </div>
      )}

      {/* Error */}
      {error && (
        <Card className="border-destructive/50">
          <CardContent className="py-8 text-center text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {/* Task list */}
      {!loading && !error && tasks.length > 0 && (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <Card
              key={task.publicKey.toBase58()}
              className="group hover:border-brand/40 transition-colors"
            >
              <CardHeader className="flex flex-row items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base group-hover:text-brand transition-colors">
                    {task.title || 'Untitled Task'}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Icons.wallet className="size-3" />
                      {lamportsToSol(task.bountyLamports)} SOL
                    </span>
                    <span className="flex items-center gap-1">
                      <Icons.clock className="size-3" />
                      {formatDeadline(task.deadline)}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-xs">
                      <Icons.users className="size-3" />
                      {shortKey(task.creator)}
                    </span>
                    {task.templateIndex > 0n && (
                      <Badge variant="secondary" className="text-xs">
                        Template
                      </Badge>
                    )}
                  </CardDescription>
                </div>
                <Badge variant={STATUS_VARIANTS[task.status as TaskStatus] ?? 'outline'}>
                  {task.status}
                </Badge>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && tasks.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-24">
            <Icons.listChecks className="size-12 text-muted-foreground/50 mb-4" />
            <CardTitle className="text-center mb-2">No Tasks Found</CardTitle>
            <CardDescription className="text-center max-w-md">
              No tasks exist on-chain yet. Connect your wallet and create the first task on devnet!
            </CardDescription>
          </CardContent>
        </Card>
      )}

      {/* Connect wallet prompt */}
      {!publicKey && (
        <Card className="mt-12">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Icons.lock className="size-12 text-muted-foreground/50 mb-4" />
            <CardTitle className="text-center mb-2">Connect Wallet to Interact</CardTitle>
            <CardDescription className="text-center max-w-md">
              Connect a Solana wallet to create, claim, and settle tasks on devnet.
            </CardDescription>
            <Button variant="brand" className="mt-6 rounded-lg" onClick={() => setVisible(true)}>
              <Icons.wallet className="mr-1 size-4" />
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  )
}
