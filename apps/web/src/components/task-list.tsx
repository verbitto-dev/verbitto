'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { PublicKey } from '@solana/web3.js'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { CreateTaskDialog } from '@/components/create-task-dialog'
import { Icons } from '@/components/icons'
import { TaskDetailDialog } from '@/components/task-detail-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  formatDeadline,
  type HistoricalTask,
  lamportsToSol,
  shortKey,
  useHistoricalTasks,
  useTasks,
} from '@/hooks/use-program'
import { triggerBackfill } from '@/lib/api'
import { STATUS_VARIANTS, type TaskAccount, type TaskStatus } from '@/lib/program'

const TASKS_PER_PAGE = 9

const TASK_STATUSES: (TaskStatus | 'All')[] = [
  'All',
  'Open',
  'Claimed',
  'Submitted',
  'Approved',
  'Rejected',
  'Cancelled',
  'Expired',
  'Disputed',
]

/** Terminal statuses whose PDA accounts are closed — data comes from history index */
const TERMINAL_STATUSES = new Set(['Approved', 'Cancelled', 'Expired'])

/** Map historical task finalStatus to TaskStatus for display */
const FINAL_STATUS_MAP: Record<string, TaskStatus> = {
  Approved: 'Approved',
  Cancelled: 'Cancelled',
  Expired: 'Expired',
  DisputeResolved: 'Disputed', // Display as Disputed with resolved indicator
}

/** Convert a HistoricalTask to a TaskAccount-compatible shape for unified card rendering */
function historicalToTaskAccount(h: HistoricalTask): TaskAccount {
  const EMPTY_KEY = PublicKey.default

  // Convert descriptionHash from hex string to Uint8Array
  const descriptionHashArray = new Uint8Array(32)
  if (h.descriptionHash && h.descriptionHash.length === 64) {
    try {
      for (let i = 0; i < 32; i++) {
        descriptionHashArray[i] = parseInt(h.descriptionHash.substr(i * 2, 2), 16)
      }
    } catch (err) {
      console.warn('Failed to parse descriptionHash:', err)
    }
  }

  return {
    publicKey: (() => {
      try {
        return new PublicKey(h.address)
      } catch {
        return EMPTY_KEY
      }
    })(),
    creator: (() => {
      try {
        return new PublicKey(h.creator)
      } catch {
        return EMPTY_KEY
      }
    })(),
    taskIndex: BigInt(h.taskIndex || '0'),
    bountyLamports: BigInt(h.bountyLamports || '0'),
    status: FINAL_STATUS_MAP[h.finalStatus] ?? 'Approved',
    agent: (() => {
      try {
        return new PublicKey(h.agent)
      } catch {
        return EMPTY_KEY
      }
    })(),
    deadline: BigInt(h.deadline || 0),
    createdAt: BigInt(h.createdAt || 0),
    settledAt: BigInt(h.closedAt || 0),
    reputationReward: 0n,
    title: h.title || `Task #${h.taskIndex != null && h.taskIndex !== '' ? h.taskIndex : '?'}`,
    descriptionHash: descriptionHashArray,
    deliverableHash: new Uint8Array(32),
    templateIndex: 0n,
    rejectionCount: 0,
    bump: 0,
  }
}

function TaskCardSkeleton() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-5 w-full mb-1" />
        <Skeleton className="h-4 w-3/4" />
        <div className="mt-3 space-y-2">
          <Skeleton className="h-6 w-24" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}

export function TaskList() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { publicKey } = useWallet()
  const { setVisible } = useWalletModal()
  const { tasks, loading, error, refetch } = useTasks()
  const {
    tasks: historicalTasks,
    loading: histLoading,
    refetch: refetchHist,
  } = useHistoricalTasks()
  const [mounted, setMounted] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskAccount | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [displayCount, setDisplayCount] = useState(TASKS_PER_PAGE)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Get filter params from URL
  const statusFilter = searchParams.get('status') || 'All'
  const templateFilter = searchParams.get('template') === 'true'

  const combinedLoading = loading || histLoading

  useEffect(() => {
    setMounted(true)
  }, [])

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(TASKS_PER_PAGE)
  }, [])

  // Merge live on-chain tasks with historical (closed) tasks
  const filteredTasks = useMemo(() => {
    // Start with on-chain tasks
    const onChain = tasks

    // Convert historical tasks to TaskAccount shape
    const historicalAsAccounts = historicalTasks.map(historicalToTaskAccount)

    // Deduplicate: if a task address exists on-chain, prefer the live version
    const onChainAddrs = new Set(onChain.map((t) => t.publicKey.toBase58()))
    const uniqueHistorical = historicalAsAccounts.filter(
      (h) => !onChainAddrs.has(h.publicKey.toBase58())
    )

    // Merge
    let merged = [...onChain, ...uniqueHistorical]

    // Sort by creation time, newest first
    merged.sort((a, b) => Number(b.createdAt - a.createdAt))

    // Filter by status
    if (statusFilter !== 'All') {
      merged = merged.filter((t) => t.status === statusFilter)
    }

    // Filter by template
    if (templateFilter) {
      merged = merged.filter((t) => t.templateIndex > 0n)
    }

    return merged
  }, [tasks, historicalTasks, statusFilter, templateFilter])

  // Paginated tasks for display
  const displayedTasks = useMemo(() => {
    return filteredTasks.slice(0, displayCount)
  }, [filteredTasks, displayCount])

  const hasMore = displayCount < filteredTasks.length

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current || combinedLoading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setDisplayCount((prev) => prev + TASKS_PER_PAGE)
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(loadMoreRef.current)

    return () => observer.disconnect()
  }, [hasMore, combinedLoading])

  // Use consistent disabled state during SSR to prevent hydration mismatch
  const walletConnected = mounted && !!publicKey

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'All') {
      params.delete('status')
    } else {
      params.set('status', value)
    }
    router.push(`/tasks?${params.toString()}`)
  }

  const handleClearFilters = () => {
    router.push('/tasks')
  }

  const handleCreateTask = () => {
    setCreateDialogOpen(true)
  }

  const handleCreateFromTemplate = () => {
    // TODO: Implement template selection
    toast.info('Create from Template feature coming soon!')
  }

  const handleTaskCreated = () => {
    // Refresh the task list after creating a new task
    refetch()
  }

  const handleTaskClick = (task: TaskAccount) => {
    setSelectedTask(task)
    setDetailDialogOpen(true)
  }

  const handleDetailClose = () => {
    setDetailDialogOpen(false)
    // Small delay before clearing to avoid UI flicker
    setTimeout(() => setSelectedTask(null), 200)
  }

  const [syncing, setSyncing] = useState(false)

  const handleSyncHistory = useCallback(async () => {
    setSyncing(true)
    try {
      const result = await triggerBackfill(500)
      if (result.eventsIngested > 0) {
        toast.success(
          `Synced ${result.eventsIngested} events (${result.signaturesScanned} txns scanned)`
        )
        refetchHist()
      } else {
        toast.info(`Scanned ${result.signaturesScanned} transactions — no new events found`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }, [refetchHist])

  return (
    <>
      {/* Action buttons and filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="flex gap-3">
          <Button
            variant="brand"
            className="rounded-lg"
            disabled={!walletConnected}
            onClick={handleCreateTask}
          >
            <Icons.zap className="mr-1 size-4" />
            Create Task
          </Button>
          <Button
            variant="outline"
            className="rounded-lg"
            disabled={!walletConnected}
            onClick={handleCreateFromTemplate}
          >
            <Icons.layoutTemplate className="mr-1 size-4" />
            From Template
          </Button>
        </div>

        <div className="flex gap-3 sm:ml-auto">
          {/* Status filter */}
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[160px] rounded-lg">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status === 'All' ? 'All Status' : status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear filters button */}
          {(statusFilter !== 'All' || templateFilter) && (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-lg"
              onClick={handleClearFilters}
              title="Clear filters"
            >
              <Icons.close className="size-4" />
            </Button>
          )}

          {/* Refresh button */}
          <Button
            variant="outline"
            size="icon"
            className="rounded-lg"
            onClick={() => {
              refetch()
              refetchHist()
            }}
            title="Refresh"
          >
            <Icons.refresh className="size-4" />
          </Button>

          {/* Sync history from RPC */}
          <div className="relative group">
            <Button
              variant="outline"
              className="rounded-lg"
              disabled={syncing}
              onClick={handleSyncHistory}
            >
              {syncing ? (
                <Icons.loader className="mr-1 size-4 animate-spin" />
              ) : (
                <Icons.databaseSync className="mr-1 size-4" />
              )}
              {syncing ? 'Syncing…' : 'Sync History'}
            </Button>
            <div className="absolute right-0 top-full mt-2 w-72 rounded-lg border bg-popover p-3 text-xs text-muted-foreground shadow-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
              <p className="font-medium text-foreground mb-1">Sync closed task history</p>
              <p>
                Tasks in terminal states (Cancelled, Expired, Approved) have their on-chain PDA
                accounts closed and cannot be queried directly. Click to scan transaction history
                and recover this data.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter summary */}
      {(statusFilter !== 'All' || templateFilter) && !combinedLoading && (
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Icons.filter className="size-4" />
          <span>
            Showing {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
            {statusFilter !== 'All' && ` with status "${statusFilter}"`}
            {templateFilter && ' from templates'}
          </span>
        </div>
      )}

      {/* Loading */}
      {combinedLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <TaskCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <Card className="border-destructive/50">
          <CardContent className="py-8 text-center text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {/* Task list */}
      {!combinedLoading && !error && displayedTasks.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedTasks.map((task) => (
              <Card
                key={task.publicKey.toBase58()}
                className="group hover:border-brand/40 transition-colors cursor-pointer flex flex-col"
                onClick={() => handleTaskClick(task)}
              >
                <CardHeader className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge
                      variant={STATUS_VARIANTS[task.status as TaskStatus] ?? 'outline'}
                      className="text-xs"
                    >
                      {task.status}
                    </Badge>
                    {task.templateIndex > 0n && (
                      <Badge variant="secondary" className="text-xs">
                        Template
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-base group-hover:text-brand transition-colors line-clamp-2">
                    {task.title || 'Untitled Task'}
                  </CardTitle>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-lg font-bold">
                      <Icons.wallet className="size-4 text-brand" />
                      {lamportsToSol(task.bountyLamports)} SOL
                    </div>
                    <CardDescription className="flex flex-col gap-1.5 text-xs">
                      <span className="flex items-center gap-1.5">
                        <Icons.clock className="size-3" />
                        {formatDeadline(task.deadline)}
                      </span>
                      <span className="flex items-center gap-1.5 font-mono">
                        <Icons.users className="size-3" />
                        {shortKey(task.creator)}
                      </span>
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Infinite scroll trigger and load more */}
          {hasMore && (
            <div className="mt-8">
              {/* Invisible trigger for infinite scroll */}
              <div ref={loadMoreRef} className="h-1" />

              {/* Manual load more button */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setDisplayCount((prev) => prev + TASKS_PER_PAGE)}
                  className="rounded-lg"
                >
                  <Icons.chevronDown className="mr-2 size-4" />
                  Load More ({filteredTasks.length - displayCount} remaining)
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!combinedLoading && !error && filteredTasks.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-24">
            <Icons.listChecks className="size-12 text-muted-foreground/50 mb-4" />
            <CardTitle className="text-center mb-2">
              {statusFilter !== 'All' || templateFilter
                ? 'No Tasks Match Filters'
                : 'No Tasks Found'}
            </CardTitle>
            <CardDescription className="text-center max-w-md">
              {statusFilter !== 'All' || templateFilter ? (
                <>
                  No tasks found with the current filters.
                  {TERMINAL_STATUSES.has(statusFilter) && (
                    <>
                      {' '}
                      {statusFilter} tasks have their on-chain PDA accounts closed. Sync from
                      transaction history to recover.
                    </>
                  )}
                </>
              ) : (
                <>
                  No tasks exist on-chain yet. Connect your wallet and create the first task on
                  devnet!
                </>
              )}
            </CardDescription>
            {TERMINAL_STATUSES.has(statusFilter) && (
              <Button
                variant="brand"
                disabled={syncing}
                onClick={handleSyncHistory}
                className="mt-4 rounded-lg"
              >
                {syncing ? (
                  <Icons.loader className="mr-1 size-4 animate-spin" />
                ) : (
                  <Icons.databaseSync className="mr-1 size-4" />
                )}
                {syncing ? 'Syncing…' : 'Sync History'}
              </Button>
            )}
            {(statusFilter !== 'All' || templateFilter) && (
              <Button variant="outline" onClick={handleClearFilters} className="mt-4 rounded-lg">
                <Icons.close className="mr-2 size-4" />
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Connect wallet prompt */}
      {!walletConnected && (
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

      {/* Create task dialog */}
      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleTaskCreated}
      />

      {/* Task detail dialog */}
      <TaskDetailDialog
        task={selectedTask}
        open={detailDialogOpen}
        onOpenChange={handleDetailClose}
        onRefresh={refetch}
      />
    </>
  )
}
