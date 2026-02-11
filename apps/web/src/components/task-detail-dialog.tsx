'use client'

import { useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Program, AnchorProvider } from '@coral-xyz/anchor'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Icons } from '@/components/icons'
import { formatDeadline, lamportsToSol, shortKey } from '@/hooks/use-program'
import { STATUS_VARIANTS, type TaskAccount, type TaskStatus } from '@/lib/program'

// Import IDL
const IDL = require('../../public/idl.json')

interface TaskDetailDialogProps {
  task: TaskAccount | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefresh?: () => void
}

export function TaskDetailDialog({ task, open, onOpenChange, onRefresh }: TaskDetailDialogProps) {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const anchorWallet = useAnchorWallet()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!task) return null

  const isCreator = publicKey && task.creator.equals(publicKey)
  const isAgent = publicKey && task.agent.equals(publicKey)
  const canClaim = task.status === 'Open' && publicKey && !isCreator
  const canSubmit = task.status === 'Claimed' && isAgent
  const canApprove = task.status === 'Submitted' && isCreator
  const canReject = task.status === 'Submitted' && isCreator
  const canCancel = (task.status === 'Open' || task.status === 'Claimed') && isCreator

  const handleClaim = async () => {
    setLoading(true)
    try {
      // TODO: Implement claim task
      alert('Claim task functionality coming soon!')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // TODO: Implement submit deliverable
      alert('Submit deliverable functionality coming soon!')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    setLoading(true)
    try {
      // TODO: Implement approve and settle
      alert('Approve and settle functionality coming soon!')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    setLoading(true)
    try {
      // TODO: Implement reject submission
      alert('Reject submission functionality coming soon!')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!publicKey || !anchorWallet) {
      setError('Please connect your wallet')
      return
    }

    if (!isCreator) {
      setError('Only the task creator can cancel this task')
      return
    }

    const confirmed = confirm(
      `Are you sure you want to cancel this task?\n\n"${task.title}"\n\nThe bounty (${lamportsToSol(task.bountyLamports)} SOL) will be refunded to your wallet.`
    )

    if (!confirmed) return

    setLoading(true)
    setError(null)

    try {


      // Create provider
      const provider = new AnchorProvider(
        connection,
        anchorWallet,
        {
          commitment: 'confirmed',
          preflightCommitment: 'confirmed',
        }
      )

      // Create program instance
      const program = new Program(IDL, provider)

      // Call cancel_task instruction
      const tx = await program.methods
        .cancelTask()
        .accounts({
          task: task.publicKey,
          creator: publicKey,
        })
        .rpc({
          skipPreflight: false,
          commitment: 'confirmed',
        })

      // Wait for confirmation
      await connection.confirmTransaction(tx, 'confirmed')

      // Show success message
      alert(`✓ Task cancelled successfully!\n\nBounty refunded: ${lamportsToSol(task.bountyLamports)} SOL\n\nTransaction: ${tx.slice(0, 8)}...\n\nThe task status has been updated to 'Cancelled'.`)

      // Close dialog and refresh task list
      onOpenChange(false)
      onRefresh?.()
    } catch (err: any) {
      console.error('Error canceling task:', err)
      console.error('Error details:', {
        name: err.name,
        message: err.message,
        code: err.code,
        logs: err.logs,
      })

      // User friendly error messages
      let errorMsg = 'Failed to cancel task'
      if (err.message?.includes('User rejected') || err.message?.includes('User denied')) {
        errorMsg = 'Transaction was rejected by wallet'
      } else if (err.message?.includes('Only the creator')) {
        errorMsg = 'Only the task creator can cancel this task'
      } else if (err.logs) {
        errorMsg = `Program error: ${err.message}`
      } else {
        errorMsg = err.message || 'Unknown error'
      }

      setError(errorMsg)
      alert(`❌ ${errorMsg}\n\nCheck console for details.`)
    } finally {
      setLoading(false)
    }
  }

  const deadlineDate = new Date(Number(task.deadline) * 1000)
  const createdDate = new Date(Number(task.createdAt) * 1000)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{task.title || 'Untitled Task'}</DialogTitle>
          <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
            <span>Task #{task.taskIndex.toString()}</span>
            <span>•</span>
            <Badge variant={STATUS_VARIANTS[task.status as TaskStatus] ?? 'outline'} className="text-xs">
              {task.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Bounty and Deadline */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Bounty</p>
              <p className="text-2xl font-bold flex items-center gap-2">
                <Icons.wallet className="size-5" />
                {lamportsToSol(task.bountyLamports)} SOL
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Deadline</p>
              <p className="text-lg font-medium">
                {formatDeadline(task.deadline)}
              </p>
              <p className="text-xs text-muted-foreground">
                {deadlineDate.toLocaleDateString()} {deadlineDate.toLocaleTimeString()}
              </p>
            </div>
          </div>

          <Separator />

          {/* Details */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Creator</p>
                <p className="font-mono">{shortKey(task.creator, 8)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Agent</p>
                <p className="font-mono">
                  {task.agent.toBase58() === '11111111111111111111111111111111'
                    ? 'Not assigned'
                    : shortKey(task.agent, 8)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Reputation Reward</p>
                <p className="font-medium">+{task.reputationReward.toString()} points</p>
              </div>
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="text-xs">{createdDate.toLocaleDateString()}</p>
              </div>
            </div>

            {task.rejectionCount > 0 && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm">
                <p className="font-medium text-destructive">
                  ⚠️ Rejected {task.rejectionCount} time{task.rejectionCount > 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Description Hash */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Description Hash (SHA-256)</p>
            </div>
            <p className="font-mono text-xs break-all bg-muted p-3 rounded">
              {Buffer.from(task.descriptionHash).toString('hex') ||
                '0000000000000000000000000000000000000000000000000000000000000000'}
            </p>
            <p className="text-xs text-muted-foreground">
              📝 在当前演示中，这是任务描述文本的SHA-256哈希值。
              在生产环境中，完整描述会存储在IPFS或Arweave上，此哈希用于验证内容完整性。
            </p>
          </div>

          {task.deliverableHash.some((b) => b !== 0) && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Deliverable Hash (SHA-256)</p>
              <p className="font-mono text-xs break-all bg-muted p-3 rounded">
                {Buffer.from(task.deliverableHash).toString('hex')}
              </p>
              <p className="text-xs text-muted-foreground">
                代理人提交的交付成果内容哈希
              </p>
            </div>
          )}

          {/* View on Explorer */}
          <a
            href={`https://explorer.solana.com/address/${task.publicKey.toBase58()}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            <Button variant="outline" size="sm" className="w-full">
              <Icons.externalLink className="mr-2 size-3" />
              View on Solana Explorer
            </Button>
          </a>
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {canClaim && (
            <Button variant="brand" onClick={handleClaim} disabled={loading} className="w-full">
              <Icons.users className="mr-2 size-4" />
              Claim Task
            </Button>
          )}

          {canSubmit && (
            <Button variant="brand" onClick={handleSubmit} disabled={loading} className="w-full">
              <Icons.upload className="mr-2 size-4" />
              Submit Deliverable
            </Button>
          )}

          {canApprove && (
            <Button variant="default" onClick={handleApprove} disabled={loading} className="w-full">
              <Icons.check className="mr-2 size-4" />
              Approve & Settle
            </Button>
          )}

          {canReject && (
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={loading}
              className="w-full"
            >
              <Icons.close className="mr-2 size-4" />
              Reject
            </Button>
          )}

          {canCancel && (
            <Button variant="outline" onClick={handleCancel} disabled={loading} className="w-full">
              {loading ? (
                <Icons.clock className="mr-2 size-4 animate-spin" />
              ) : (
                <Icons.close className="mr-2 size-4" />
              )}
              {loading ? 'Canceling...' : 'Cancel Task'}
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="w-full"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
