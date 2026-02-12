import { PublicKey } from '@solana/web3.js'

// ============================================================
// Program ID & PDA helpers
// ============================================================

// Read from environment variable, fallback to devnet deployment
const PROGRAM_ID_STRING =
  (typeof process !== 'undefined' && process.env?.SOLANA_PROGRAM_ID) ||
  'Coxgjx4UMQZPRdDZT9CAdrvt4TMTyUKH79ziJiNFHk8S' // Default: current devnet deployment

export const PROGRAM_ID = new PublicKey(PROGRAM_ID_STRING)

export function getPlatformPda(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync([Buffer.from('platform')], PROGRAM_ID)
  return pda
}

export function getTaskPda(creator: PublicKey, taskIndex: bigint): PublicKey {
  const buf = Buffer.alloc(8)
  buf.writeBigUInt64LE(taskIndex)
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('task'), creator.toBuffer(), buf],
    PROGRAM_ID
  )
  return pda
}

export function getAgentProfilePda(authority: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('agent'), authority.toBuffer()],
    PROGRAM_ID
  )
  return pda
}

export function getCreatorCounterPda(creator: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('creator'), creator.toBuffer()],
    PROGRAM_ID
  )
  return pda
}

export function getDisputePda(task: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('dispute'), task.toBuffer()],
    PROGRAM_ID
  )
  return pda
}

export function getVotePda(dispute: PublicKey, voter: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('vote'), dispute.toBuffer(), voter.toBuffer()],
    PROGRAM_ID
  )
  return pda
}

export function getTemplatePda(creator: PublicKey, templateIndex: bigint): PublicKey {
  const buf = Buffer.alloc(8)
  buf.writeBigUInt64LE(templateIndex)
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('template'), creator.toBuffer(), buf],
    PROGRAM_ID
  )
  return pda
}

// ============================================================
// Account discriminators (first 8 bytes of sha256("account:<Name>"))
// Anchor convention
// ============================================================

// Pre-computed for gPA filters - values from IDL
export const DISCRIMINATOR = {
  Platform: Buffer.from([77, 92, 204, 58, 187, 98, 91, 12]),
  Task: Buffer.from([79, 34, 229, 55, 88, 90, 55, 84]),
  AgentProfile: Buffer.from([60, 227, 42, 24, 0, 87, 86, 205]),
  CreatorCounter: Buffer.from([62, 129, 78, 26, 23, 138, 248, 82]),
}

// ============================================================
// Task status enum (mirrors Rust)
// ============================================================

export const TASK_STATUS = [
  'Open',
  'Claimed',
  'Submitted',
  'Approved',
  'Rejected',
  'Cancelled',
  'Expired',
  'Disputed',
] as const

export type TaskStatus = (typeof TASK_STATUS)[number]

export const STATUS_VARIANTS: Record<
  TaskStatus,
  'outline' | 'secondary' | 'default' | 'destructive'
> = {
  Open: 'outline',
  Claimed: 'secondary',
  Submitted: 'default',
  Approved: 'default',
  Rejected: 'destructive',
  Cancelled: 'secondary',
  Expired: 'secondary',
  Disputed: 'destructive',
}

// ============================================================
// Deserialized types
// ============================================================

export interface PlatformAccount {
  authority: PublicKey
  feeBps: number
  minBountyLamports: bigint
  treasury: PublicKey
  taskCount: bigint
  templateCount: bigint
  totalSettledLamports: bigint
  disputeVotingPeriod: bigint
  disputeMinVotes: number
  minVoterReputation: bigint
  claimGracePeriod: bigint
  isPaused: boolean
  bump: number
}

export interface TaskAccount {
  publicKey: PublicKey
  creator: PublicKey
  taskIndex: bigint
  bountyLamports: bigint
  status: TaskStatus
  agent: PublicKey
  deadline: bigint
  createdAt: bigint
  settledAt: bigint
  reputationReward: bigint
  title: string
  descriptionHash: Uint8Array
  deliverableHash: Uint8Array
  templateIndex: bigint
  rejectionCount: number
  bump: number
}

// ============================================================
// Manual deserialization (no IDL dependency)
// ============================================================

export function decodePlatform(data: Buffer): PlatformAccount {
  let offset = 8 // skip discriminator

  const authority = new PublicKey(data.subarray(offset, offset + 32))
  offset += 32
  const feeBps = data.readUInt16LE(offset)
  offset += 2
  const minBountyLamports = data.readBigUInt64LE(offset)
  offset += 8
  const treasury = new PublicKey(data.subarray(offset, offset + 32))
  offset += 32
  const taskCount = data.readBigUInt64LE(offset)
  offset += 8
  const templateCount = data.readBigUInt64LE(offset)
  offset += 8
  const totalSettledLamports = data.readBigUInt64LE(offset)
  offset += 8
  const disputeVotingPeriod = data.readBigInt64LE(offset)
  offset += 8
  const disputeMinVotes = data.readUInt8(offset)
  offset += 1
  const minVoterReputation = data.readBigInt64LE(offset)
  offset += 8
  const claimGracePeriod = data.readBigInt64LE(offset)
  offset += 8
  const isPaused = data.readUInt8(offset) === 1
  offset += 1
  const bump = data.readUInt8(offset)

  return {
    authority,
    feeBps,
    minBountyLamports,
    treasury,
    taskCount,
    templateCount,
    totalSettledLamports,
    disputeVotingPeriod,
    disputeMinVotes,
    minVoterReputation,
    claimGracePeriod,
    isPaused,
    bump,
  }
}

export function decodeTask(pubkey: PublicKey, data: Buffer): TaskAccount {
  let offset = 8 // skip discriminator

  const creator = new PublicKey(data.subarray(offset, offset + 32))
  offset += 32
  const taskIndex = data.readBigUInt64LE(offset)
  offset += 8
  const bountyLamports = data.readBigUInt64LE(offset)
  offset += 8
  const statusByte = data.readUInt8(offset)
  offset += 1
  const status = TASK_STATUS[statusByte] ?? 'Open'
  const agent = new PublicKey(data.subarray(offset, offset + 32))
  offset += 32
  const deadline = data.readBigInt64LE(offset)
  offset += 8
  const createdAt = data.readBigInt64LE(offset)
  offset += 8
  const settledAt = data.readBigInt64LE(offset)
  offset += 8
  const reputationReward = data.readBigInt64LE(offset)
  offset += 8

  // String: 4-byte length prefix + utf8
  const titleLen = data.readUInt32LE(offset)
  offset += 4
  const title = data.subarray(offset, offset + titleLen).toString('utf8')
  offset += titleLen

  const descriptionHash = new Uint8Array(data.subarray(offset, offset + 32))
  offset += 32
  const deliverableHash = new Uint8Array(data.subarray(offset, offset + 32))
  offset += 32
  const templateIndex = data.readBigUInt64LE(offset)
  offset += 8
  const rejectionCount = data.readUInt8(offset)
  offset += 1
  const bump = data.readUInt8(offset)

  return {
    publicKey: pubkey,
    creator,
    taskIndex,
    bountyLamports,
    status,
    agent,
    deadline,
    createdAt,
    settledAt,
    reputationReward,
    title,
    descriptionHash,
    deliverableHash,
    templateIndex,
    rejectionCount,
    bump,
  }
}
