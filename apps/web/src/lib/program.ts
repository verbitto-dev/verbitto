// Re-export everything from the shared program package

export type {
  PlatformAccount,
  TaskAccount,
  TaskCategory,
  TaskStatus,
  TaskTemplateAccount,
} from '@verbitto/program'
export {
  DISCRIMINATOR,
  decodePlatform,
  decodeTask,
  decodeTaskTemplate,
  getAgentProfilePda,
  getCreatorCounterPda,
  getDisputePda,
  getPlatformPda,
  getTaskPda,
  getTemplatePda,
  getVotePda,
  PROGRAM_ID,
  STATUS_VARIANTS,
  TASK_CATEGORY,
  TASK_STATUS,
} from '@verbitto/program'
