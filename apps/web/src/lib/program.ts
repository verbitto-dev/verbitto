// Re-export everything from the shared program package

export type { PlatformAccount, TaskAccount, TaskStatus } from '@verbitto/program'
export {
  DISCRIMINATOR,
  decodePlatform,
  decodeTask,
  getAgentProfilePda,
  getCreatorCounterPda,
  getDisputePda,
  getPlatformPda,
  getTaskPda,
  getVotePda,
  PROGRAM_ID,
  STATUS_VARIANTS,
  TASK_STATUS,
} from '@verbitto/program'
