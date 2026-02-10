import { PublicKey } from '@solana/web3.js'
export declare const PROGRAM_ID: PublicKey
export declare function getPlatformPda(): PublicKey
export declare function getTaskPda(creator: PublicKey, taskIndex: bigint): PublicKey
export declare function getAgentProfilePda(authority: PublicKey): PublicKey
export declare function getCreatorCounterPda(creator: PublicKey): PublicKey
export declare function getDisputePda(task: PublicKey): PublicKey
export declare function getVotePda(dispute: PublicKey, voter: PublicKey): PublicKey
export declare const DISCRIMINATOR: {
  Platform: Buffer<ArrayBuffer>
  Task: Buffer<ArrayBuffer>
  AgentProfile: Buffer<ArrayBuffer>
  CreatorCounter: Buffer<ArrayBuffer>
}
export declare const TASK_STATUS: readonly [
  'Open',
  'Claimed',
  'Submitted',
  'Approved',
  'Rejected',
  'Cancelled',
  'Expired',
  'Disputed',
]
export type TaskStatus = (typeof TASK_STATUS)[number]
export declare const STATUS_VARIANTS: Record<
  TaskStatus,
  'outline' | 'secondary' | 'default' | 'destructive'
>
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
export declare function decodePlatform(data: Buffer): PlatformAccount
export declare function decodeTask(pubkey: PublicKey, data: Buffer): TaskAccount
//# sourceMappingURL=index.d.ts.map
