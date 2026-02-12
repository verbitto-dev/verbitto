/**
 * Event Store — PostgreSQL-backed persistence for indexed Anchor events.
 *
 * Uses Drizzle ORM for database operations.
 * Maintains in-memory caches for fast reads, synced from DB on startup.
 *
 * Design: append-only log of IndexedEvent + derived HistoricalTask projection.
 */

import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import { deliverableDescriptions, historicalTasks, indexedEvents, taskDescriptions, taskTitles } from '../db/schema.js'

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

export interface IndexedEvent {
  /** Transaction signature */
  signature: string
  /** Slot number */
  slot: number
  /** Block unix timestamp */
  blockTime: number
  /** Anchor event name, e.g. "TaskCreated" */
  eventName: string
  /** Parsed event fields (all values stringified for JSON safety) */
  data: Record<string, string>
}

/**
 * Flattened historical task reconstructed from lifecycle events.
 * Closed-account tasks can only be served from here.
 */
export interface HistoricalTask {
  /** Task PDA base58 */
  address: string
  /** Task title from create_task instruction data */
  title: string
  /** SHA-256 hash of the description (hex) */
  descriptionHash: string
  /** SHA-256 hash of the deliverable (hex) */
  deliverableHash: string
  creator: string
  taskIndex: string
  bountyLamports: string
  deadline: number
  /** The terminal status that caused account closure */
  finalStatus: 'Approved' | 'Cancelled' | 'Expired' | 'DisputeResolved'
  agent: string
  /** SOL paid to agent (Approved / DisputeResolved in favour) */
  payoutLamports: string
  /** Platform fee (Approved / DisputeResolved) */
  feeLamports: string
  /** Refund to creator (Cancelled / Expired) */
  refundedLamports: string
  /** blockTime of TaskCreated event */
  createdAt: number
  /** blockTime of terminal event */
  closedAt: number
  /** Full event trail */
  events: IndexedEvent[]
}

// ────────────────────────────────────────────────────────────
// In-memory caches (populated from DB on startup)
// ────────────────────────────────────────────────────────────

/** Set of processed dedup keys to avoid re-inserting */
const processedSigs = new Set<string>()

/** task address → list of events (used to build HistoricalTask) */
const taskEventsMap = new Map<string, IndexedEvent[]>()

/** task address → title (from instruction data or DB) */
const titleMap = new Map<string, string>()

// ────────────────────────────────────────────────────────────
// Load from DB on startup
// ────────────────────────────────────────────────────────────

export async function loadStore(): Promise<void> {
  try {
    // Load all events into memory for projection
    const rows = await db.select().from(indexedEvents).orderBy(desc(indexedEvents.blockTime))
    for (const row of rows) {
      const dedupeKey = row.id
      processedSigs.add(dedupeKey)

      const evt: IndexedEvent = {
        signature: row.signature,
        slot: row.slot,
        blockTime: row.blockTime,
        eventName: row.eventName,
        data: row.data as Record<string, string>,
      }

      const taskAddr = row.taskAddress
      if (taskAddr) {
        const list = taskEventsMap.get(taskAddr) ?? []
        list.push(evt)
        taskEventsMap.set(taskAddr, list)
      }
    }

    // Load titles
    const titleRows = await db.select().from(taskTitles)
    for (const row of titleRows) {
      titleMap.set(row.taskAddress, row.title)
    }
  } catch (err) {
    console.error('[EventStore] Failed to load from DB:', err)
  }
}

// ────────────────────────────────────────────────────────────
// Write path
// ────────────────────────────────────────────────────────────

const TERMINAL_EVENTS = new Set(['TaskSettled', 'TaskCancelled', 'TaskExpired', 'DisputeResolved'])

/** Events that should auto-publicize deliverables (task completed successfully) */
const PUBLICIZE_EVENTS = new Set(['TaskSettled', 'DisputeResolved'])

/**
 * Ingest a batch of parsed events from a single transaction.
 * Returns the number of *new* events actually stored.
 */
export async function ingestEvents(batch: IndexedEvent[]): Promise<number> {
  let added = 0
  const toInsert: Array<typeof indexedEvents.$inferInsert> = []

  for (const evt of batch) {
    // Deduplicate by signature+eventName (a tx may emit multiple events)
    const dedupeKey = `${evt.signature}:${evt.eventName}`
    if (processedSigs.has(dedupeKey)) continue
    processedSigs.add(dedupeKey)

    added++

    // Track per-task event list in memory
    const taskAddr = evt.data.task
    if (taskAddr) {
      const list = taskEventsMap.get(taskAddr) ?? []
      list.push(evt)
      taskEventsMap.set(taskAddr, list)
    }

    toInsert.push({
      id: dedupeKey,
      signature: evt.signature,
      slot: evt.slot,
      blockTime: evt.blockTime,
      eventName: evt.eventName,
      data: evt.data,
      taskAddress: taskAddr ?? null,
    })
  }

  // Batch insert to DB
  if (toInsert.length > 0) {
    try {
      await db.insert(indexedEvents).values(toInsert).onConflictDoNothing()
    } catch (err) {
      console.error('[EventStore] Failed to insert events:', err)
    }
  }

  // Auto-publicize deliverables when tasks are approved/resolved
  for (const evt of batch) {
    if (PUBLICIZE_EVENTS.has(evt.eventName) && evt.data.task) {
      await publicizeDeliverables(evt.data.task)
    }
  }

  return added
}

/**
 * Build a HistoricalTask record from the terminal event + earlier events.
 */
function projectHistoricalTask(taskAddr: string, terminalEvent: IndexedEvent): HistoricalTask {
  const allEvents = taskEventsMap.get(taskAddr) ?? [terminalEvent]

  const createdEvt = allEvents.find((e) => e.eventName === 'TaskCreated')
  const claimedEvt = allEvents.find((e) => e.eventName === 'TaskClaimed')
  const submittedEvt = allEvents.find((e) => e.eventName === 'DeliverableSubmitted')

  const finalStatus = mapTerminalStatus(terminalEvent.eventName)

  // Extract descriptionHash from TaskCreated event (it's an array of u8)
  let descriptionHash = ''
  if (createdEvt?.data.description_hash) {
    try {
      // The description_hash in event data might be a JSON stringified array or comma-separated string
      const hashData = createdEvt.data.description_hash
      let hashArray: number[] = []

      if (typeof hashData === 'string') {
        // Try parsing as JSON array first
        try {
          hashArray = JSON.parse(hashData)
        } catch {
          // If not JSON, try comma-separated
          hashArray = hashData.split(',').map((s) => parseInt(s.trim(), 10))
        }
      } else if (Array.isArray(hashData)) {
        hashArray = hashData
      }

      // Convert to hex string
      descriptionHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
    } catch (err) {
      console.warn(`[EventStore] Failed to parse description_hash for task ${taskAddr}:`, err)
    }
  }

  // Extract deliverableHash from DeliverableSubmitted event
  let deliverableHash = ''
  if (submittedEvt?.data.deliverable_hash) {
    deliverableHash = submittedEvt.data.deliverable_hash
  }

  return {
    address: taskAddr,
    title: titleMap.get(taskAddr) ?? '',
    descriptionHash,
    deliverableHash,
    creator: createdEvt?.data.creator ?? terminalEvent.data.creator ?? '',
    taskIndex: createdEvt?.data.task_index ?? '',
    bountyLamports: createdEvt?.data.bounty_lamports ?? '0',
    deadline: createdEvt ? Number(createdEvt.data.deadline ?? 0) : 0,
    finalStatus,
    agent: claimedEvt?.data.agent ?? terminalEvent.data.agent ?? '',
    payoutLamports: terminalEvent.data.payout_lamports ?? '0',
    feeLamports: terminalEvent.data.fee_lamports ?? '0',
    refundedLamports: terminalEvent.data.refunded_lamports ?? '0',
    createdAt: createdEvt?.blockTime ?? terminalEvent.blockTime,
    closedAt: terminalEvent.blockTime,
    events: allEvents.sort((a, b) => a.blockTime - b.blockTime),
  }
}

/**
 * Re-project all historical tasks from event trails and upsert to DB.
 */
export async function rebuildHistoricalTasks(): Promise<void> {
  let _rebuilt = 0

  for (const [taskAddr, evts] of taskEventsMap.entries()) {
    const terminalEvt = evts.find((e) => TERMINAL_EVENTS.has(e.eventName))
    if (!terminalEvt) continue

    const ht = projectHistoricalTask(taskAddr, terminalEvt)
    try {
      await db
        .insert(historicalTasks)
        .values({
          address: ht.address,
          title: ht.title,
          descriptionHash: ht.descriptionHash,
          deliverableHash: ht.deliverableHash,
          creator: ht.creator,
          taskIndex: ht.taskIndex,
          bountyLamports: ht.bountyLamports,
          deadline: ht.deadline,
          finalStatus: ht.finalStatus,
          agent: ht.agent,
          payoutLamports: ht.payoutLamports,
          feeLamports: ht.feeLamports,
          refundedLamports: ht.refundedLamports,
          createdAt: ht.createdAt,
          closedAt: ht.closedAt,
        })
        .onConflictDoUpdate({
          target: historicalTasks.address,
          set: {
            title: ht.title,
            descriptionHash: ht.descriptionHash,
            deliverableHash: ht.deliverableHash,
            creator: ht.creator,
            taskIndex: ht.taskIndex,
            bountyLamports: ht.bountyLamports,
            deadline: ht.deadline,
            finalStatus: ht.finalStatus,
            agent: ht.agent,
            payoutLamports: ht.payoutLamports,
            feeLamports: ht.feeLamports,
            refundedLamports: ht.refundedLamports,
            createdAt: ht.createdAt,
            closedAt: ht.closedAt,
          },
        })
      _rebuilt++
    } catch (err) {
      console.error(`[EventStore] Failed to upsert historical task ${taskAddr}:`, err)
    }
  }
}

/**
 * Store a task title extracted from instruction data.
 */
export async function setTaskTitle(taskAddr: string, title: string): Promise<void> {
  titleMap.set(taskAddr, title)
  try {
    await db.insert(taskTitles).values({ taskAddress: taskAddr, title }).onConflictDoUpdate({
      target: taskTitles.taskAddress,
      set: { title },
    })
  } catch (err) {
    console.error('[EventStore] Failed to save task title:', err)
  }
}

/**
 * Store task data (title + descriptionHash) extracted from instruction data during backfill.
 */
export async function setTaskData(
  taskAddr: string,
  title: string,
  descriptionHash: string
): Promise<void> {
  titleMap.set(taskAddr, title)
  try {
    // Store title
    await db.insert(taskTitles).values({ taskAddress: taskAddr, title }).onConflictDoUpdate({
      target: taskTitles.taskAddress,
      set: { title },
    })

    // Store descriptionHash reference (without content, as we don't have it during backfill)
    await db
      .insert(taskDescriptions)
      .values({
        descriptionHash,
        content: '', // Empty content during backfill
        taskAddress: taskAddr,
      })
      .onConflictDoNothing()
  } catch (err) {
    console.error('[EventStore] Failed to save task data:', err)
  }
}

function mapTerminalStatus(eventName: string): HistoricalTask['finalStatus'] {
  switch (eventName) {
    case 'TaskSettled':
      return 'Approved'
    case 'TaskCancelled':
      return 'Cancelled'
    case 'TaskExpired':
      return 'Expired'
    case 'DisputeResolved':
      return 'DisputeResolved'
    default:
      return 'Approved'
  }
}

/**
 * Mark all deliverable descriptions linked to a task as 'public'.
 * Called automatically when a task reaches Approved / DisputeResolved status.
 */
async function publicizeDeliverables(taskAddress: string): Promise<void> {
  try {
    const result = await db
      .update(deliverableDescriptions)
      .set({ visibility: 'public' })
      .where(eq(deliverableDescriptions.taskAddress, taskAddress))
    console.info(`[EventStore] Publicized deliverables for task ${taskAddress}`)
  } catch (err) {
    console.error(`[EventStore] Failed to publicize deliverables for ${taskAddress}:`, err)
  }
}

// ────────────────────────────────────────────────────────────
// Read path
// ────────────────────────────────────────────────────────────

export interface HistoryQuery {
  status?: string
  creator?: string
  agent?: string
  limit?: number
  offset?: number
}

export async function queryHistoricalTasks(q: HistoryQuery) {
  const conditions = []
  if (q.status)
    conditions.push(eq(historicalTasks.finalStatus, q.status as HistoricalTask['finalStatus']))
  if (q.creator) conditions.push(eq(historicalTasks.creator, q.creator))
  if (q.agent) conditions.push(eq(historicalTasks.agent, q.agent))

  const where = conditions.length > 0 ? and(...conditions) : undefined
  const limit = Math.min(q.limit ?? 100, 500)
  const offset = q.offset ?? 0

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(historicalTasks)
      .where(where)
      .orderBy(desc(historicalTasks.closedAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(historicalTasks).where(where),
  ])

  const total = countResult[0]?.count ?? 0

  // Enrich with event trails from memory
  const tasks: HistoricalTask[] = rows.map((row) => ({
    address: row.address,
    title: row.title,
    descriptionHash: row.descriptionHash,
    deliverableHash: row.deliverableHash,
    creator: row.creator,
    taskIndex: row.taskIndex,
    bountyLamports: row.bountyLamports,
    deadline: row.deadline,
    finalStatus: row.finalStatus as HistoricalTask['finalStatus'],
    agent: row.agent,
    payoutLamports: row.payoutLamports,
    feeLamports: row.feeLamports,
    refundedLamports: row.refundedLamports,
    createdAt: row.createdAt,
    closedAt: row.closedAt,
    events: taskEventsMap.get(row.address)?.sort((a, b) => a.blockTime - b.blockTime) ?? [],
  }))

  return { tasks, total, limit, offset }
}

export async function getHistoricalTask(address: string): Promise<HistoricalTask | undefined> {
  const rows = await db
    .select()
    .from(historicalTasks)
    .where(eq(historicalTasks.address, address))
    .limit(1)
  if (rows.length === 0) return undefined

  const row = rows[0]
  return {
    address: row.address,
    title: row.title,
    descriptionHash: row.descriptionHash,
    deliverableHash: row.deliverableHash,
    creator: row.creator,
    taskIndex: row.taskIndex,
    bountyLamports: row.bountyLamports,
    deadline: row.deadline,
    finalStatus: row.finalStatus as HistoricalTask['finalStatus'],
    agent: row.agent,
    payoutLamports: row.payoutLamports,
    feeLamports: row.feeLamports,
    refundedLamports: row.refundedLamports,
    createdAt: row.createdAt,
    closedAt: row.closedAt,
    events: taskEventsMap.get(row.address)?.sort((a, b) => a.blockTime - b.blockTime) ?? [],
  }
}

export async function getRecentEvents(limit = 50): Promise<IndexedEvent[]> {
  const rows = await db
    .select()
    .from(indexedEvents)
    .orderBy(desc(indexedEvents.blockTime))
    .limit(limit)

  return rows.map((r) => ({
    signature: r.signature,
    slot: r.slot,
    blockTime: r.blockTime,
    eventName: r.eventName,
    data: r.data as Record<string, string>,
  }))
}

export function getEventsByTask(taskAddress: string): IndexedEvent[] {
  return (taskEventsMap.get(taskAddress) ?? []).sort((a, b) => a.blockTime - b.blockTime)
}

/** Summary stats for the dashboard */
export async function getIndexerStats() {
  const [totalEventsResult, statusCounts] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(indexedEvents),
    db
      .select({
        finalStatus: historicalTasks.finalStatus,
        count: sql<number>`count(*)::int`,
      })
      .from(historicalTasks)
      .groupBy(historicalTasks.finalStatus),
  ])

  const byStatus: Record<string, number> = {}
  let totalHistoricalTasks = 0
  for (const row of statusCounts) {
    byStatus[row.finalStatus] = row.count
    totalHistoricalTasks += row.count
  }

  // Get latest event time from memory cache (faster than DB query)
  let lastEventTime: number | null = null
  for (const evts of taskEventsMap.values()) {
    for (const e of evts) {
      if (!lastEventTime || e.blockTime > lastEventTime) {
        lastEventTime = e.blockTime
      }
    }
  }

  return {
    totalEvents: totalEventsResult[0]?.count ?? 0,
    totalHistoricalTasks,
    byStatus,
    lastEventTime,
  }
}

// ── Legacy compatibility export (no-op, save is now immediate via DB) ──
export async function saveStore(): Promise<void> {
  // No-op: data is persisted to DB immediately on write
}
