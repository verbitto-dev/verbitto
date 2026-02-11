'use client'

import { useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Program, AnchorProvider } from '@coral-xyz/anchor'
import { useState } from 'react'
import { toast } from 'sonner'

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
import { Textarea } from '@/components/ui/textarea'
import { Icons } from '@/components/icons'
import { formatDeadline, lamportsToSol, shortKey } from '@/hooks/use-program'
import { STATUS_VARIANTS, type TaskAccount, type TaskStatus, getPlatformPda, getAgentProfilePda, decodePlatform } from '@/lib/program'
import IDL from '../../public/idl.json'

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
  const [deliverableText, setDeliverableText] = useState('')
  const [rejectReasonText, setRejectReasonText] = useState('')

  if (!task) return null

  const isCreator = publicKey && task.creator.equals(publicKey)
  const isAgent = publicKey && task.agent.equals(publicKey)
  const canClaim = task.status === 'Open' && publicKey && !isCreator
  const canSubmit = task.status === 'Claimed' && isAgent
  const canApprove = task.status === 'Submitted' && isCreator
  const canReject = task.status === 'Submitted' && isCreator
  const canCancel = (task.status === 'Open' || task.status === 'Claimed') && isCreator

  const handleClaim = async () => {
    if (!publicKey || !anchorWallet) {
      setError('Please connect your wallet')
      return
    }

    // Proceed with claiming

    setLoading(true)
    setError(null)

    try {
      const provider = new AnchorProvider(connection, anchorWallet, {
        commitment: 'confirmed',
        preflightCommitment: 'confirmed',
      })
      const program = new Program(IDL, provider)

      const tx = await program.methods
        .claimTask()
        .accounts({
          task: task.publicKey,
          platform: getPlatformPda(),
          agentProfile: getAgentProfilePda(publicKey),
          agent: publicKey,
        })
        .rpc({ skipPreflight: false, commitment: 'confirmed' })

      await connection.confirmTransaction(tx, 'confirmed')

      toast.success(`Task claimed successfully! Tx: ${tx.slice(0, 8)}...`)
      onOpenChange(false)
      onRefresh?.()
    } catch (err: any) {
      console.error('Error claiming task:', err)
      let errorMsg = 'Failed to claim task'
      if (err.message?.includes('User rejected') || err.message?.includes('User denied')) {
        errorMsg = 'Transaction was rejected by wallet'
      } else if (err.logs) {
        errorMsg = `Program error: ${err.message}`
      } else {
        errorMsg = err.message || 'Unknown error'
      }
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!publicKey || !anchorWallet) {
      setError('Please connect your wallet')
      return
    }

    if (!deliverableText.trim()) {
      setError('Please enter deliverable description')
      return
    }

    // Proceed with submission

    setLoading(true)
    setError(null)

    try {
      // Hash the deliverable text
      const encoder = new TextEncoder()
      const data = encoder.encode(deliverableText)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const deliverableHash = Array.from(new Uint8Array(hashBuffer))

      const provider = new AnchorProvider(connection, anchorWallet, {
        commitment: 'confirmed',
        preflightCommitment: 'confirmed',
      })
      const program = new Program(IDL, provider)

      const tx = await program.methods
        .submitDeliverable(deliverableHash)
        .accounts({
          task: task.publicKey,
          platform: getPlatformPda(),
          agent: publicKey,
        })
        .rpc({ skipPreflight: false, commitment: 'confirmed' })

      await connection.confirmTransaction(tx, 'confirmed')

      toast.success(`Deliverable submitted! Tx: ${tx.slice(0, 8)}...`)
      setDeliverableText('')
      onOpenChange(false)
      onRefresh?.()
    } catch (err: any) {
      console.error('Error submitting deliverable:', err)
      let errorMsg = 'Failed to submit deliverable'
      if (err.message?.includes('User rejected') || err.message?.includes('User denied')) {
        errorMsg = 'Transaction was rejected by wallet'
      } else if (err.logs) {
        errorMsg = `Program error: ${err.message}`
      } else {
        errorMsg = err.message || 'Unknown error'
      }
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!publicKey || !anchorWallet) {
      setError('Please connect your wallet')
      return
    }

    // Proceed with approval

    setLoading(true)
    setError(null)

    try {
      const provider = new AnchorProvider(connection, anchorWallet, {
        commitment: 'confirmed',
        preflightCommitment: 'confirmed',
      })
      const program = new Program(IDL, provider)

      // Fetch platform account to get treasury address
      const platformPda = getPlatformPda()
      const platformInfo = await connection.getAccountInfo(platformPda)
      if (!platformInfo) throw new Error('Platform account not found')
      const platform = decodePlatform(platformInfo.data as Buffer)

      const tx = await program.methods
        .approveAndSettle()
        .accounts({
          task: task.publicKey,
          platform: platformPda,
          creator: publicKey,
          agent: task.agent,
          agentProfile: getAgentProfilePda(task.agent),
          treasury: platform.treasury,
        })
        .rpc({ skipPreflight: false, commitment: 'confirmed' })

      await connection.confirmTransaction(tx, 'confirmed')

      toast.success(`Task approved! Bounty ${lamportsToSol(task.bountyLamports)} SOL sent. Tx: ${tx.slice(0, 8)}...`)
      onOpenChange(false)
      onRefresh?.()
    } catch (err: any) {
      console.error('Error approving task:', err)
      let errorMsg = 'Failed to approve and settle'
      if (err.message?.includes('User rejected') || err.message?.includes('User denied')) {
        errorMsg = 'Transaction was rejected by wallet'
      } else if (err.logs) {
        errorMsg = `Program error: ${err.message}`
      } else {
        errorMsg = err.message || 'Unknown error'
      }
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!publicKey || !anchorWallet) {
      setError('Please connect your wallet')
      return
    }

    if (!rejectReasonText.trim()) {
      setError('Please enter a rejection reason')
      return
    }

    // Proceed with rejection

    setLoading(true)
    setError(null)

    try {
      // Hash the rejection reason
      const encoder = new TextEncoder()
      const data = encoder.encode(rejectReasonText)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const reasonHash = Array.from(new Uint8Array(hashBuffer))

      const provider = new AnchorProvider(connection, anchorWallet, {
        commitment: 'confirmed',
        preflightCommitment: 'confirmed',
      })
      const program = new Program(IDL, provider)

      const tx = await program.methods
        .rejectSubmission(reasonHash)
        .accounts({
          task: task.publicKey,
          creator: publicKey,
        })
        .rpc({ skipPreflight: false, commitment: 'confirmed' })

      await connection.confirmTransaction(tx, 'confirmed')

      toast.success(`Submission rejected. Tx: ${tx.slice(0, 8)}...`)
      setRejectReasonText('')
      onOpenChange(false)
      onRefresh?.()
    } catch (err: any) {
      console.error('Error rejecting submission:', err)
      let errorMsg = 'Failed to reject submission'
      if (err.message?.includes('User rejected') || err.message?.includes('User denied')) {
        errorMsg = 'Transaction was rejected by wallet'
      } else if (err.logs) {
        errorMsg = `Program error: ${err.message}`
      } else {
        errorMsg = err.message || 'Unknown error'
      }
      setError(errorMsg)
      toast.error(errorMsg)
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

    // Proceed with cancellation

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
      toast.success(`Task cancelled. Bounty ${lamportsToSol(task.bountyLamports)} SOL refunded. Tx: ${tx.slice(0, 8)}...`)

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
      toast.error(errorMsg)
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

        {/* Deliverable input for agents */}
        {canSubmit && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Deliverable Description</label>
            <Textarea
              placeholder="Describe your deliverable (e.g. link to PR, IPFS hash, or summary of work done)..."
              value={deliverableText}
              onChange={(e) => setDeliverableText(e.target.value)}
              rows={3}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              This text will be SHA-256 hashed and stored on-chain.
            </p>
          </div>
        )}

        {/* Rejection reason input for creators */}
        {canReject && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Rejection Reason (for Reject)</label>
            <Textarea
              placeholder="Explain why the submission is being rejected..."
              value={rejectReasonText}
              onChange={(e) => setRejectReasonText(e.target.value)}
              rows={2}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Required when rejecting. This text will be SHA-256 hashed.
            </p>
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
