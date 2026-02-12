'use client'

import { AnchorProvider, BN, Program } from '@coral-xyz/anchor'
import { useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react'
import { ComputeBudgetProgram, SystemProgram } from '@solana/web3.js'
import { useState } from 'react'
import { Icons } from '@/components/icons'
import { MarkdownEditor } from '@/components/markdown-editor'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Skeleton } from '@/components/ui/skeleton'
import { lamportsToSol, useTemplates } from '@/hooks/use-program'
import { storeDescription } from '@/lib/api'
import {
  getCreatorCounterPda,
  getPlatformPda,
  getTaskPda,
  type TaskTemplateAccount,
} from '@/lib/program'
import IDL from '../../public/idl.json'

interface CreateFromTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const CATEGORY_LABELS: Record<string, string> = {
  DataLabeling: 'Data Labeling',
  LiteratureReview: 'Literature Review',
  CodeReview: 'Code Review',
  Translation: 'Translation',
  Analysis: 'Analysis',
  Research: 'Research',
  Other: 'Other',
}

const CATEGORY_ICONS: Record<string, keyof typeof Icons> = {
  DataLabeling: 'layers',
  LiteratureReview: 'fileText',
  CodeReview: 'code',
  Translation: 'globe',
  Analysis: 'filter',
  Research: 'search',
  Other: 'zap',
}

export function CreateFromTemplateDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateFromTemplateDialogProps) {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const anchorWallet = useAnchorWallet()
  const { templates, loading: templatesLoading } = useTemplates()

  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplateAccount | null>(null)
  const [description, setDescription] = useState('')
  const [bounty, setBounty] = useState('')
  const [deadlineDays, setDeadlineDays] = useState('7')
  const [reputationReward, setReputationReward] = useState('50')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSelectTemplate = (template: TaskTemplateAccount) => {
    setSelectedTemplate(template)
    setBounty((Number(template.defaultBountyLamports) / 1e9).toString())
    setDescription('')
    setError(null)
  }

  const handleBack = () => {
    setSelectedTemplate(null)
    setError(null)
  }

  const handleClose = () => {
    setSelectedTemplate(null)
    setError(null)
    onOpenChange(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!publicKey || !anchorWallet || !selectedTemplate) {
      setError('Please connect your wallet and select a template')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // Check balance
      const balance = await connection.getBalance(publicKey)
      const requiredBounty = Math.round(parseFloat(bounty) * 1e9)
      const estimatedFees = 0.01 * 1e9

      if (balance < requiredBounty + estimatedFees) {
        setError(
          `Insufficient balance. You need at least ${(requiredBounty + estimatedFees) / 1e9} SOL`
        )
        setSubmitting(false)
        return
      }

      const provider = new AnchorProvider(connection, anchorWallet, {
        commitment: 'confirmed',
        preflightCommitment: 'confirmed',
        skipPreflight: false,
      })

      const program = new Program(IDL, provider)

      const bountyLamports = new BN(Math.round(parseFloat(bounty) * 1e9))
      const deadlineTimestamp = Math.floor(Date.now() / 1000) + parseInt(deadlineDays, 10) * 86400

      // Hash description for on-chain verification
      let descriptionHashArray = new Uint8Array(32)
      if (description) {
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
          const data = counterAccount.data
          taskIndex = new BN(data.readBigUInt64LE(8 + 32)) // After discriminator + creator pubkey
        }
      } catch (_e) {
        console.warn('Creator counter not found, using taskIndex = 0')
      }

      // Verify template exists and is active
      console.log('🔍 Verifying template account...')
      const templateAccount = await connection.getAccountInfo(selectedTemplate.publicKey)
      if (!templateAccount) {
        throw new Error('Template account not found on-chain')
      }
      if (!selectedTemplate.isActive) {
        throw new Error('Template is not active')
      }
      console.log('✅ Template verified:', {
        address: selectedTemplate.publicKey.toBase58(),
        title: selectedTemplate.title,
        isActive: selectedTemplate.isActive,
      })

      const taskPda = getTaskPda(publicKey, BigInt(taskIndex.toString()))
      const platformPda = getPlatformPda()

      console.log('🔍 Transaction details:', {
        taskPda: taskPda.toBase58(),
        creatorCounter: creatorCounterPda.toBase58(),
        template: selectedTemplate.publicKey.toBase58(),
        platform: platformPda.toBase58(),
        creator: publicKey.toBase58(),
        taskIndex: taskIndex.toString(),
      })

      const tx = await program.methods
        .createTaskFromTemplate(
          bountyLamports,
          new BN(deadlineTimestamp),
          new BN(parseInt(reputationReward, 10)),
          taskIndex,
          Array.from(descriptionHashArray)
        )
        .accounts({
          task: taskPda,
          creatorCounter: creatorCounterPda,
          template: selectedTemplate.publicKey,
          platform: platformPda,
          creator: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .preInstructions([ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 })])
        .transaction()

      // Get latest blockhash
      const { blockhash } = await connection.getLatestBlockhash('confirmed')
      tx.recentBlockhash = blockhash
      tx.feePayer = publicKey

      console.log('🔍 Simulating transaction...')
      try {
        const simulation = await connection.simulateTransaction(tx)
        console.log('✅ Simulation result:', simulation)
        if (simulation.value.err) {
          console.error('❌ Simulation failed:', simulation.value)
          throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`)
        }
      } catch (simErr: unknown) {
        console.error('❌ Simulation error:', simErr)
        const message = simErr instanceof Error ? simErr.message : 'Unknown error'
        throw new Error(`Simulation failed: ${message}`)
      }

      console.log('📝 Signing transaction with wallet...')
      const signedTx = await anchorWallet.signTransaction(tx)
      console.log('✅ Transaction signed, sending...')

      const signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
      })
      console.log('📡 Transaction sent:', signature)

      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature, 'confirmed')
      console.log('✅ Transaction confirmed:', confirmation)

      // Store description text in API database
      if (description) {
        const hashHex = Array.from(descriptionHashArray)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
        try {
          await storeDescription({
            descriptionHash: hashHex,
            content: description,
            taskAddress: taskPda.toBase58(),
            creator: publicKey.toBase58(),
          })
        } catch (err) {
          console.warn('Failed to store description text:', err)
        }
      }

      // Reset and close
      setSelectedTemplate(null)
      setDescription('')
      setBounty('')
      setDeadlineDays('7')
      setReputationReward('50')
      onOpenChange(false)
      onSuccess?.()
    } catch (err: unknown) {
      console.error('❌ Error creating task from template:', err)
      const error = err as { name?: string; message?: string; code?: number; logs?: string[] }

      // Log full error details
      console.error('Full error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        logs: error.logs,
      })

      // User friendly error messages
      if (error.message?.includes('User rejected') || error.code === 4001) {
        setError('Transaction was rejected. Please approve the transaction in your wallet.')
      } else if (error.message?.includes('Template account not found')) {
        setError('Template not found on-chain. It may have been deleted.')
      } else if (error.message?.includes('Template is not active')) {
        setError('This template is no longer active.')
      } else if (error.message?.includes('Simulation failed')) {
        setError(`Transaction would fail: ${error.message}. Check console (F12) for detailed logs.`)
      } else if (error.message?.includes('insufficient funds')) {
        setError('Insufficient SOL balance. Please add more SOL to your wallet.')
      } else if (error.code === -32603) {
        setError('Wallet RPC error. Please refresh the page and try again.')
      } else {
        setError(
          `Failed to create task: ${error.message || 'Unknown error'}. Check browser console (F12) for details.`
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{selectedTemplate ? 'Configure Task' : 'Select a Template'}</DialogTitle>
          <DialogDescription>
            {selectedTemplate
              ? `Creating task from "${selectedTemplate.title}" template. Customize the bounty and deadline.`
              : 'Choose a template to quickly create a new task with pre-configured settings.'}
          </DialogDescription>
        </DialogHeader>

        {/* Template selection step */}
        {!selectedTemplate && (
          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            {templatesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Skeleton className="size-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Icons.layoutTemplate className="size-12 mx-auto mb-3 opacity-50" />
                <p>No templates available</p>
              </div>
            ) : (
              <div className="space-y-2">
                {templates.map((template) => {
                  const iconKey = CATEGORY_ICONS[template.category] || 'zap'
                  const Icon = Icons[iconKey] || Icons.zap
                  return (
                    <Card
                      key={template.publicKey.toBase58()}
                      className="cursor-pointer hover:border-brand/40 transition-colors"
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <CardHeader className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 items-center justify-center rounded-lg bg-brand/10 text-brand shrink-0">
                            <Icon className="size-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-sm">{template.title}</CardTitle>
                            <CardDescription className="text-xs mt-0.5">
                              Default: {lamportsToSol(template.defaultBountyLamports)} SOL
                              {' · '}Used {template.timesUsed.toString()} times
                            </CardDescription>
                          </div>
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {CATEGORY_LABELS[template.category] || template.category}
                          </Badge>
                        </div>
                      </CardHeader>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Configuration step */}
        {selectedTemplate && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Template info summary */}
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
              <div className="flex size-8 items-center justify-center rounded-md bg-brand/10 text-brand">
                <Icons.layoutTemplate className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{selectedTemplate.title}</p>
                <p className="text-xs text-muted-foreground">
                  {CATEGORY_LABELS[selectedTemplate.category] || selectedTemplate.category}
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={handleBack}>
                Change
              </Button>
            </div>

            <MarkdownEditor
              id="tpl-description"
              label="Description"
              value={description}
              onChange={setDescription}
              placeholder="Describe the specific requirements for this task..."
              rows={4}
              hint="Supports Markdown formatting. The template provides the category and defaults."
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tpl-bounty">Bounty (SOL) *</Label>
                <Input
                  id="tpl-bounty"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder={lamportsToSol(selectedTemplate.defaultBountyLamports)}
                  value={bounty}
                  onChange={(e) => setBounty(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tpl-deadline">Deadline (days) *</Label>
                <Input
                  id="tpl-deadline"
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
              <Label htmlFor="tpl-reputation">Reputation Reward *</Label>
              <Input
                id="tpl-reputation"
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
              <Button type="button" variant="outline" onClick={handleBack} disabled={submitting}>
                Back
              </Button>
              <Button type="submit" variant="brand" disabled={submitting || !publicKey}>
                {submitting && <Icons.clock className="mr-2 size-4 animate-spin" />}
                {submitting ? 'Creating...' : 'Create Task'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
