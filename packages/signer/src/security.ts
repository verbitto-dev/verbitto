import { PublicKey, type Transaction } from '@solana/web3.js'

/**
 * Verbitto program ID — only instructions targeting this program are allowed.
 * Override via PROGRAM_ID env var if deploying a custom program.
 */
export const ALLOWED_PROGRAM_ID = new PublicKey(
  process.env.PROGRAM_ID || 'FL4r4cpufpsdbhxLe4Gr3CMpPxAyeAu7WgRZHGb21Tor'
)

/** System Program is allowed (for account creation, transfers initiated by Anchor) */
const SYSTEM_PROGRAM_ID = new PublicKey('11111111111111111111111111111111')

/** Compute Budget program (used for priority fees / compute unit limits) */
const COMPUTE_BUDGET_ID = new PublicKey('ComputeBudget111111111111111111111111111111')

export interface ValidationResult {
  valid: boolean
  reason?: string
}

/**
 * Validate that every instruction in a transaction targets an allowed program.
 * Prevents malicious API servers from crafting SOL transfer / token drain txns.
 */
export function validateTransaction(tx: Transaction): ValidationResult {
  const allowedPrograms = [
    ALLOWED_PROGRAM_ID.toBase58(),
    SYSTEM_PROGRAM_ID.toBase58(),
    COMPUTE_BUDGET_ID.toBase58(),
  ]

  for (const ix of tx.instructions) {
    const programId = ix.programId.toBase58()
    if (!allowedPrograms.includes(programId)) {
      return {
        valid: false,
        reason:
          `Instruction targets disallowed program: ${programId}. ` +
          `Only Verbitto (${ALLOWED_PROGRAM_ID.toBase58()}), SystemProgram, ` +
          `and ComputeBudget are permitted.`,
      }
    }
  }

  // Ensure at least one instruction targets the Verbitto program
  const hasVerbitto = tx.instructions.some(
    (ix) => ix.programId.toBase58() === ALLOWED_PROGRAM_ID.toBase58()
  )
  if (!hasVerbitto) {
    return {
      valid: false,
      reason: 'Transaction contains no Verbitto program instructions. Refusing to sign.',
    }
  }

  return { valid: true }
}
