'use client'

import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react'
import { SystemProgram } from '@solana/web3.js'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Icons } from '@/components/icons'
import { MarkdownRenderer } from '@/components/markdown-renderer'
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
import { formatDeadline, lamportsToSol, shortKey } from '@/hooks/use-program'
import { fetchDescription, fetchMessages, sendMessage, type TaskMessage } from '@/lib/api'
import {
  decodePlatform,
  getAgentProfilePda,
  getPlatformPda,
  STATUS_VARIANTS,
  type TaskAccount,
  type TaskStatus,
} from '@/lib/program'
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
  const [descriptionContent, setDescriptionContent] = useState<string | null>(null)
  const [messages, setMessages] = useState<TaskMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [mobileTab, setMobileTab] = useState<'details' | 'messages'>('details')
  const [chatInput, setChatInput] = useState('')
  const [chatSending, setChatSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch description content from API when dialog opens
  useEffect(() => {
    if (!open || !task) {
      setDescriptionContent(null)
      return
    }

    // Check if task has pre-loaded description content (from historical tasks)
    const taskWithDesc = task as TaskAccount & { _descriptionContent?: string }
    if (taskWithDesc._descriptionContent) {
      setDescriptionContent(taskWithDesc._descriptionContent)
      return
    }

    // Otherwise, fetch by hash
    const hashHex = Buffer.from(task.descriptionHash).toString('hex')
    const isZero = task.descriptionHash.every((b) => b === 0)
    if (isZero) return

    fetchDescription(hashHex).then((desc) => {
      if (desc) setDescriptionContent(desc.content)
    })
  }, [open, task])

  // Fetch messages when dialog opens
  useEffect(() => {
    if (!open || !task) {
      setMessages([])
      return
    }

    const taskAddr = task.publicKey.toBase58()
    // In demo mode, we pass the creator as requester so messages are always visible
    const requester = task.creator.toBase58()

    setMessagesLoading(true)
    fetchMessages(taskAddr, requester)
      .then((data) => setMessages(data.messages))
      .catch(() => setMessages([]))
      .finally(() => setMessagesLoading(false))
  }, [open, task])

  // Auto-scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!task) return null

  const isCreator = publicKey && task.creator.equals(publicKey)
  const isAgent = publicKey && task.agent.equals(publicKey)
  const canClaim = task.status === 'Open' && publicKey && !isCreator
  const canSubmit = task.status === 'Claimed' && isAgent
  const canApprove = task.status === 'Submitted' && isCreator
  const canReject = task.status === 'Submitted' && isCreator
  const canCancel = (task.status === 'Open' || task.status === 'Claimed') && isCreator

  // Chat: user is a participant and task is in an active messaging status
  const CHAT_STATUSES = ['Claimed', 'Submitted', 'Rejected', 'Disputed']
  const canChat = publicKey && (isCreator || isAgent) && CHAT_STATUSES.includes(task.status)

  const handleSendMessage = async () => {
    if (!publicKey || !task || !chatInput.trim()) return
    setChatSending(true)
    try {
      const result = await sendMessage(
        task.publicKey.toBase58(),
        publicKey.toBase58(),
        chatInput.trim()
      )
      if (result.ok && result.message) {
        setMessages((prev) => [...prev, result.message!])
        setChatInput('')
      } else {
        toast.error(result.error || 'Failed to send message')
      }
    } catch {
      toast.error('Failed to send message')
    } finally {
      setChatSending(false)
    }
  }

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

      // Check if agent profile exists, if not, register it first
      const agentProfilePda = getAgentProfilePda(publicKey)
      const agentProfileInfo = await connection.getAccountInfo(agentProfilePda)

      if (!agentProfileInfo) {
        // Agent profile doesn't exist, need to register first
        toast.info('Registering agent profile...')
        const registerTx = await program.methods
          .registerAgent(0) // skillTags=0 for general tasks
          .accounts({
            agentProfile: agentProfilePda,
            authority: publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc({ skipPreflight: false, commitment: 'confirmed' })

        await connection.confirmTransaction(registerTx, 'confirmed')
        toast.success('Agent profile registered!')
      }

      const tx = await program.methods
        .claimTask()
        .accounts({
          task: task.publicKey,
          platform: getPlatformPda(),
          agentProfile: agentProfilePda,
          agent: publicKey,
        })
        .rpc({ skipPreflight: false, commitment: 'confirmed' })

      await connection.confirmTransaction(tx, 'confirmed')

      toast.success(`Task claimed successfully! Tx: ${tx.slice(0, 8)}...`)
      onOpenChange(false)
      onRefresh?.()
    } catch (err: unknown) {
      console.error('Error claiming task:', err)
      const error = err as { message?: string; logs?: unknown }
      let errorMsg = 'Failed to claim task'
      if (error.message?.includes('User rejected') || error.message?.includes('User denied')) {
        errorMsg = 'Transaction was rejected by wallet'
      } else if (error.logs) {
        errorMsg = `Program error: ${error.message}`
      } else {
        errorMsg = error.message || 'Unknown error'
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
    } catch (err: unknown) {
      console.error('Error submitting deliverable:', err)
      const error = err as { message?: string; logs?: unknown }
      let errorMsg = 'Failed to submit deliverable'
      if (error.message?.includes('User rejected') || error.message?.includes('User denied')) {
        errorMsg = 'Transaction was rejected by wallet'
      } else if (error.logs) {
        errorMsg = `Program error: ${error.message}`
      } else {
        errorMsg = error.message || 'Unknown error'
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

      toast.success(
        `Task approved! Bounty ${lamportsToSol(task.bountyLamports)} SOL sent. Tx: ${tx.slice(0, 8)}...`
      )
      onOpenChange(false)
      onRefresh?.()
    } catch (err: unknown) {
      console.error('Error approving task:', err)
      const error = err as { message?: string; logs?: unknown }
      let errorMsg = 'Failed to approve and settle'
      if (error.message?.includes('User rejected') || error.message?.includes('User denied')) {
        errorMsg = 'Transaction was rejected by wallet'
      } else if (error.logs) {
        errorMsg = `Program error: ${error.message}`
      } else {
        errorMsg = error.message || 'Unknown error'
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
    } catch (err: unknown) {
      console.error('Error rejecting submission:', err)
      const error = err as { message?: string; logs?: unknown }
      let errorMsg = 'Failed to reject submission'
      if (error.message?.includes('User rejected') || error.message?.includes('User denied')) {
        errorMsg = 'Transaction was rejected by wallet'
      } else if (error.logs) {
        errorMsg = `Program error: ${error.message}`
      } else {
        errorMsg = error.message || 'Unknown error'
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
      const provider = new AnchorProvider(connection, anchorWallet, {
        commitment: 'confirmed',
        preflightCommitment: 'confirmed',
      })

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
      toast.success(
        `Task cancelled. Bounty ${lamportsToSol(task.bountyLamports)} SOL refunded. Tx: ${tx.slice(0, 8)}...`
      )

      // Close dialog and refresh task list
      onOpenChange(false)
      onRefresh?.()
    } catch (err: unknown) {
      console.error('Error canceling task:', err)
      const error = err as { name?: string; message?: string; code?: string; logs?: unknown }
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        logs: error.logs,
      })

      // User friendly error messages
      let errorMsg = 'Failed to cancel task'
      if (error.message?.includes('User rejected') || error.message?.includes('User denied')) {
        errorMsg = 'Transaction was rejected by wallet'
      } else if (error.message?.includes('Only the creator')) {
        errorMsg = 'Only the task creator can cancel this task'
      } else if (error.logs) {
        errorMsg = `Program error: ${error.message}`
      } else {
        errorMsg = error.message || 'Unknown error'
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
      <DialogContent
        hideClose
        className="flex flex-col gap-0 top-0 translate-y-0 sm:top-[50%] sm:translate-y-[-50%] h-[100dvh] max-h-[100dvh] sm:h-auto sm:max-h-[85vh] sm:max-w-[960px] overflow-hidden p-0 sm:rounded-lg rounded-none"
      >
        {/* Mobile tab switcher */}
        <div className="flex sm:hidden h-11 shrink-0 border-b">
          <button
            type="button"
            onClick={() => setMobileTab('details')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 h-full text-sm font-medium transition-colors border-b-2 ${
              mobileTab === 'details'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icons.fileText className="size-4" />
            Details
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('messages')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 h-full text-sm font-medium transition-colors border-b-2 ${
              mobileTab === 'messages'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icons.messageCircle className="size-4" />
            Messages
            {messages.length > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {messages.length}
              </Badge>
            )}
          </button>
        </div>

        {/* Two-column layout (desktop) / tab content (mobile) */}
        <div className="flex flex-col sm:flex-row flex-1 min-h-0 sm:max-h-[85vh]">
          {/* ── Left Column: Task Details ── */}
          <div
            className={`flex-1 overflow-y-auto p-6 sm:border-r ${mobileTab !== 'details' ? 'hidden sm:block' : ''}`}
          >
            <DialogHeader className="sm:items-center items-start text-left">
              <div className="flex items-start justify-between w-full gap-4">
                <div className="flex-1 space-y-2">
                  <DialogTitle className="text-xl text-left">
                    {task.title || 'Untitled Task'}
                  </DialogTitle>
                  <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
                    <span
                      title={`Creator PDA Index: Task #${task.taskIndex.toString()} by this creator`}
                    >
                      PDA #{task.taskIndex.toString()}
                    </span>
                    <span>•</span>
                    <Badge
                      variant={STATUS_VARIANTS[task.status as TaskStatus] ?? 'outline'}
                      className="text-xs"
                    >
                      {task.status}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 size-8 -mt-1 -mr-1"
                  onClick={() => onOpenChange(false)}
                >
                  <Icons.close className="size-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>
            </DialogHeader>

            <div className="space-y-4 mt-4">
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
                  <p className="text-lg font-medium">{formatDeadline(task.deadline)}</p>
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
                  <p className="text-sm text-muted-foreground">Description</p>
                </div>
                {descriptionContent ? (
                  <div className="bg-muted p-3 rounded space-y-2">
                    <MarkdownRenderer content={descriptionContent} />
                    <p className="font-mono text-[10px] text-muted-foreground break-all">
                      SHA-256: {Buffer.from(task.descriptionHash).toString('hex')}
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="font-mono text-xs break-all bg-muted p-3 rounded">
                      {Buffer.from(task.descriptionHash).toString('hex') ||
                        '0000000000000000000000000000000000000000000000000000000000000000'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Full description text not available. Only the on-chain SHA-256 hash is shown.
                    </p>
                  </>
                )}
              </div>

              {task.deliverableHash.some((b) => b !== 0) && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Deliverable Hash (SHA-256)</p>
                  <p className="font-mono text-xs break-all bg-muted p-3 rounded">
                    {Buffer.from(task.deliverableHash).toString('hex')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    SHA-256 hash of the deliverable content submitted by the agent.
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
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive mt-4">
                {error}
              </div>
            )}

            {/* Deliverable input for agents */}
            {canSubmit && (
              <div className="space-y-2 mt-4">
                <label htmlFor="deliverable-input" className="text-sm font-medium">
                  Deliverable Description
                </label>
                <Textarea
                  id="deliverable-input"
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
              <div className="space-y-2 mt-4">
                <label htmlFor="reject-reason-input" className="text-sm font-medium">
                  Rejection Reason (for Reject)
                </label>
                <Textarea
                  id="reject-reason-input"
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

            <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
              {canClaim && (
                <Button variant="brand" onClick={handleClaim} disabled={loading} className="w-full">
                  <Icons.users className="mr-2 size-4" />
                  Claim Task
                </Button>
              )}

              {canSubmit && (
                <Button
                  variant="brand"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full"
                >
                  <Icons.upload className="mr-2 size-4" />
                  Submit Deliverable
                </Button>
              )}

              {canApprove && (
                <Button
                  variant="default"
                  onClick={handleApprove}
                  disabled={loading}
                  className="w-full"
                >
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
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                  className="w-full"
                >
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
          </div>

          {/* ── Right Column: Messages ── */}
          <div
            className={`w-full sm:w-[320px] flex flex-col bg-muted/20 overflow-hidden ${mobileTab !== 'messages' ? 'hidden sm:flex' : ''}`}
          >
            <div className="hidden sm:flex items-center gap-2 px-4 py-3 border-b">
              <Icons.messageCircle className="size-4 text-muted-foreground" />
              <p className="text-sm font-medium">Messages</p>
              {messages.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {messages.length}
                </Badge>
              )}
            </div>

            {/* Demo banner */}
            <div className="mx-3 mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              <Icons.shield className="inline size-3 mr-1 -mt-0.5" />
              Demo only — in production, only the task creator and assigned agent can view messages.
            </div>

            {/* Messages list */}
            <div className="flex-1 overflow-y-auto p-3">
              {task.agent.toBase58() === '11111111111111111111111111111111' ? (
                <div className="flex flex-col items-center sm:justify-center justify-start h-full text-center py-8">
                  <Icons.users className="size-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">No agent assigned yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Messaging becomes available once an agent claims this task.
                  </p>
                </div>
              ) : messagesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Icons.loader className="size-4 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center sm:justify-center justify-start h-full text-center py-8">
                  <Icons.messageCircle className="size-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">No messages yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Creator and agent can exchange messages via the Signer CLI.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((msg) => {
                    const isMsgCreator = msg.sender === task.creator.toBase58()
                    const roleLabel = isMsgCreator ? 'Creator' : 'Agent'
                    const roleColor = isMsgCreator
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-green-600 dark:text-green-400'
                    return (
                      <div
                        key={msg.id}
                        className="rounded-md bg-background p-2.5 text-sm shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 ${roleColor}`}
                            >
                              {roleLabel}
                            </Badge>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {shortKey(msg.sender, 4)}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(msg.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Chat input */}
            {canChat && (
              <div className="border-t p-3">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type a message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    disabled={chatSending}
                    className="min-h-[36px] max-h-[100px] resize-none text-sm"
                    rows={1}
                  />
                  <Button
                    size="sm"
                    onClick={handleSendMessage}
                    disabled={chatSending || !chatInput.trim()}
                    className="shrink-0 self-end"
                  >
                    {chatSending ? (
                      <Icons.loader className="size-4 animate-spin" />
                    ) : (
                      <Icons.send className="size-4" />
                    )}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
