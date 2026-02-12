/**
 * Task Access Control — verify requester identity against on-chain task data.
 *
 * Used for deliverable visibility checks and message authorization.
 */

import { PublicKey } from '@solana/web3.js'
import { DISCRIMINATOR, decodeTask } from '@verbitto/program'
import { getConnection } from './solana.js'

export interface TaskParticipants {
  creator: string
  agent: string
  status: string
}

const SYSTEM_PUBKEY = '11111111111111111111111111111111'

/**
 * Fetch task on-chain and return { creator, agent, status }.
 * Tries live account first; falls back to historical_tasks DB if the
 * account is closed (Approved / Cancelled / Expired).
 */
export async function getTaskParticipants(taskAddress: string): Promise<TaskParticipants | null> {
  try {
    const connection = getConnection()
    const pubkey = new PublicKey(taskAddress)
    const info = await connection.getAccountInfo(pubkey)

    if (info && info.data.length > 0) {
      // Verify discriminator
      const disc = info.data.subarray(0, 8)
      if (Buffer.compare(disc, DISCRIMINATOR.Task) !== 0) return null

      const task = decodeTask(pubkey, Buffer.from(info.data))
      return {
        creator: task.creator.toBase58(),
        agent: task.agent.toBase58(),
        status: task.status,
      }
    }

    // Account closed — try historical DB
    const { db } = await import('../db/index.js')
    const { historicalTasks } = await import('../db/schema.js')
    const { eq } = await import('drizzle-orm')

    const rows = await db
      .select()
      .from(historicalTasks)
      .where(eq(historicalTasks.address, taskAddress))
      .limit(1)

    if (rows.length > 0) {
      const row = rows[0]
      return {
        creator: row.creator,
        agent: row.agent,
        status: row.finalStatus,
      }
    }

    return null
  } catch (err) {
    console.error('[TaskAccess] Failed to fetch task participants:', err)
    return null
  }
}

/**
 * Check if a requester pubkey is the creator or assigned agent of the task.
 * Returns false for unassigned tasks (agent == SystemProgram) if requester is not creator.
 */
export function isTaskParticipant(participants: TaskParticipants, requester: string): boolean {
  if (requester === participants.creator) return true
  if (requester === participants.agent && participants.agent !== SYSTEM_PUBKEY) return true
  return false
}

/**
 * Terminal statuses where deliverables should be publicly visible.
 */
export function isTerminalPublicStatus(status: string): boolean {
  return ['Approved', 'DisputeResolved'].includes(status)
}
