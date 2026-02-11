'use client'

import { useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react'
import { type PublicKey, SystemProgram } from '@solana/web3.js'
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Icons } from '@/components/icons'
import { PROGRAM_ID, getPlatformPda, getTaskPda, getCreatorCounterPda } from '@/lib/program'

// Import IDL
const IDL = require('../../public/idl.json')

interface CreateTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateTaskDialog({ open, onOpenChange, onSuccess }: CreateTaskDialogProps) {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const anchorWallet = useAnchorWallet()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [bounty, setBounty] = useState('0.1')
  const [deadlineDays, setDeadlineDays] = useState('7')
  const [reputationReward, setReputationReward] = useState('50')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!publicKey || !anchorWallet) {
      setError('Please connect your wallet')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Check balance first
      const balance = await connection.getBalance(publicKey)
      const requiredBounty = Math.round(parseFloat(bounty) * 1e9)
      const estimatedFees = 0.01 * 1e9 // Estimate 0.01 SOL for fees and rent

      if (balance < requiredBounty + estimatedFees) {
        setError(`Insufficient balance. You need at least ${(requiredBounty + estimatedFees) / 1e9} SOL`)
        setLoading(false)
        return
      }

      // Create provider with explicit options
      const provider = new AnchorProvider(
        connection,
        anchorWallet,
        {
          commitment: 'confirmed',
          preflightCommitment: 'confirmed',
          skipPreflight: false,
        }
      )

      // Create program instance
      const program = new Program(IDL, provider)

      // Convert bounty to lamports
      const bountyLamports = new BN(Math.round(parseFloat(bounty) * 1e9))

      // Calculate deadline (current time + days)
      const deadlineTimestamp = Math.floor(Date.now() / 1000) + parseInt(deadlineDays) * 86400

      // Hash description (simplified - in production use IPFS/Arweave)
      let descriptionHashArray = new Uint8Array(32)
      if (description) {
        // Use Web Crypto API for browser compatibility
        const encoder = new TextEncoder()
        const data = encoder.encode(description)
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        descriptionHashArray = new Uint8Array(hashBuffer)
      }

      // Get creator counter to determine task index
      const creatorCounterPda = getCreatorCounterPda(publicKey)
      let taskIndex = new BN(0)

      try {
        const counterAccount = await connection.getAccountInfo(creatorCounterPda)
        if (counterAccount) {
          // Parse counter from account data (after 8-byte discriminator)
          const data = counterAccount.data
          taskIndex = new BN(data.readBigUInt64LE(8 + 32)) // After discriminator + creator pubkey
        }
      } catch (e) {
        console.log('Creator counter not found, using index 0')
      }

      // Get PDAs
      const platformPda = getPlatformPda()
      const taskPda = getTaskPda(publicKey, BigInt(taskIndex.toString()))

      // Build transaction
      const txBuilder = program.methods
        .createTask(
          title,
          Array.from(descriptionHashArray),
          bountyLamports,
          taskIndex,
          new BN(deadlineTimestamp),
          new BN(parseInt(reputationReward))
        )
        .accounts({
          task: taskPda,
          creatorCounter: creatorCounterPda,
          platform: platformPda,
          creator: publicKey,
          systemProgram: SystemProgram.programId,
        })

      // Send transaction with increased compute units
      const tx = await txBuilder.rpc({
        skipPreflight: false,
        commitment: 'confirmed',
      })

      // Reset form
      setTitle('')
      setDescription('')
      setBounty('0.1')
      setDeadlineDays('7')
      setReputationReward('50')

      // Close dialog and notify success
      onOpenChange(false)
      onSuccess?.()
    } catch (err: any) {
      console.error('Error creating task:', err)
      console.error('Error details:', {
        name: err.name,
        message: err.message,
        code: err.code,
        logs: err.logs,
      })

      // User friendly error messages
      if (err.message?.includes('User rejected')) {
        setError('Transaction was rejected. Please approve the transaction in your Phantom wallet.')
      } else if (err.message?.includes('Insufficient balance') || err.message?.includes('insufficient funds')) {
        setError('Insufficient SOL balance. Please add more SOL to your wallet.')
      } else if (err.message?.includes('simulation failed')) {
        setError(`Transaction would fail: ${err.message}. Check console for details.`)
      } else if (err.code === 4001 || err.code === -32603) {
        setError('Wallet error: Transaction was rejected or failed. Please try again.')
      } else {
        setError(`Failed to create task: ${err.message || 'Unknown error'}. Check browser console for details.`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Create a new task with a SOL bounty on devnet. Connect your wallet and fill out the
            details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              placeholder="e.g. Write documentation for Solana smart contract"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={64}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Detailed task description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              In production, this would be stored on IPFS/Arweave
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bounty">Bounty (SOL) *</Label>
              <Input
                id="bounty"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.1"
                value={bounty}
                onChange={(e) => setBounty(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline (days) *</Label>
              <Input
                id="deadline"
                type="number"
                min="1"
                placeholder="7"
                value={deadlineDays}
                onChange={(e) => setDeadlineDays(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reputation">Reputation Reward *</Label>
            <Input
              id="reputation"
              type="number"
              min="0"
              placeholder="50"
              value={reputationReward}
              onChange={(e) => setReputationReward(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="brand" disabled={loading || !publicKey}>
              {loading && <Icons.clock className="mr-2 size-4 animate-spin" />}
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
