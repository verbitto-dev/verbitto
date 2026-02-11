/**
 * Event Store — file-backed persistence for indexed Anchor events.
 *
 * Maintains an in-memory Map keyed by task address for fast lookups.
 * Periodically flushes to a JSON file on disk so data survives restarts.
 *
 * Design: append-only log of IndexedEvent + derived HistoricalTask projection.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

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
// Persistence path
// ────────────────────────────────────────────────────────────

const DATA_DIR = join(
    process.env.DATA_DIR || join(process.cwd(), 'data'),
)
const EVENTS_FILE = join(DATA_DIR, 'events.json')
const TASKS_FILE = join(DATA_DIR, 'historical-tasks.json')

function ensureDir() {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
}

// ────────────────────────────────────────────────────────────
// In-memory state
// ────────────────────────────────────────────────────────────

/** All raw events, newest first */
let events: IndexedEvent[] = []

/** task address → HistoricalTask (only terminal tasks) */
const taskMap = new Map<string, HistoricalTask>()

/** Set of processed signatures to avoid duplicates */
const processedSigs = new Set<string>()

/** task address → list of events (used to build HistoricalTask) */
const taskEventsMap = new Map<string, IndexedEvent[]>()

// ────────────────────────────────────────────────────────────
// Load / Save
// ────────────────────────────────────────────────────────────

export function loadStore() {
    ensureDir()
    try {
        if (existsSync(EVENTS_FILE)) {
            const raw = JSON.parse(readFileSync(EVENTS_FILE, 'utf-8')) as IndexedEvent[]
            events = raw
            for (const e of raw) {
                processedSigs.add(e.signature)
                const taskAddr = e.data.task
                if (taskAddr) {
                    const list = taskEventsMap.get(taskAddr) ?? []
                    list.push(e)
                    taskEventsMap.set(taskAddr, list)
                }
            }
            console.log(`[EventStore] Loaded ${events.length} events from disk`)
        }
    } catch (err) {
        console.error('[EventStore] Failed to load events:', err)
    }

    try {
        if (existsSync(TASKS_FILE)) {
            const raw = JSON.parse(readFileSync(TASKS_FILE, 'utf-8')) as HistoricalTask[]
            for (const t of raw) {
                taskMap.set(t.address, t)
            }
            console.log(`[EventStore] Loaded ${taskMap.size} historical tasks from disk`)
        }
    } catch (err) {
        console.error('[EventStore] Failed to load historical tasks:', err)
    }
}

let flushTimer: ReturnType<typeof setTimeout> | null = null

function scheduleSave() {
    if (flushTimer) return
    flushTimer = setTimeout(() => {
        flushTimer = null
        saveStore()
    }, 2_000)
}

export function saveStore() {
    ensureDir()
    try {
        writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2))
        writeFileSync(TASKS_FILE, JSON.stringify([...taskMap.values()], null, 2))
    } catch (err) {
        console.error('[EventStore] Failed to save:', err)
    }
}

// ────────────────────────────────────────────────────────────
// Write path
// ────────────────────────────────────────────────────────────

const TERMINAL_EVENTS = new Set([
    'TaskSettled',
    'TaskCancelled',
    'TaskExpired',
    'DisputeResolved',
])

/**
 * Ingest a batch of parsed events from a single transaction.
 * Returns the number of *new* events actually stored.
 */
export function ingestEvents(batch: IndexedEvent[]): number {
    let added = 0

    for (const evt of batch) {
        // Deduplicate by signature+eventName (a tx may emit multiple events)
        const dedupeKey = `${evt.signature}:${evt.eventName}`
        if (processedSigs.has(dedupeKey)) continue
        processedSigs.add(dedupeKey)

        events.unshift(evt) // newest first
        added++

        // Track per-task event list
        const taskAddr = evt.data.task
        if (taskAddr) {
            const list = taskEventsMap.get(taskAddr) ?? []
            list.push(evt)
            taskEventsMap.set(taskAddr, list)
        }

        // Build / update historical task on terminal events
        if (TERMINAL_EVENTS.has(evt.eventName) && taskAddr) {
            projectHistoricalTask(taskAddr, evt)
        }
    }

    if (added > 0) scheduleSave()
    return added
}

/**
 * Build a HistoricalTask record from the terminal event + earlier events.
 */
function projectHistoricalTask(taskAddr: string, terminalEvent: IndexedEvent) {
    const allEvents = taskEventsMap.get(taskAddr) ?? [terminalEvent]

    // Find TaskCreated event for metadata
    const createdEvt = allEvents.find((e) => e.eventName === 'TaskCreated')
    const claimedEvt = allEvents.find((e) => e.eventName === 'TaskClaimed')

    const finalStatus = mapTerminalStatus(terminalEvent.eventName)

    const historical: HistoricalTask = {
        address: taskAddr,
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

    taskMap.set(taskAddr, historical)
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

export function queryHistoricalTasks(q: HistoryQuery) {
    let results = [...taskMap.values()]

    if (q.status) {
        results = results.filter((t) => t.finalStatus === q.status)
    }
    if (q.creator) {
        results = results.filter((t) => t.creator === q.creator)
    }
    if (q.agent) {
        results = results.filter((t) => t.agent === q.agent)
    }

    // Sort newest-closed first
    results.sort((a, b) => b.closedAt - a.closedAt)

    const total = results.length
    const offset = q.offset ?? 0
    const limit = Math.min(q.limit ?? 100, 500)
    const page = results.slice(offset, offset + limit)

    return { tasks: page, total, limit, offset }
}

export function getHistoricalTask(address: string): HistoricalTask | undefined {
    return taskMap.get(address)
}

export function getRecentEvents(limit = 50): IndexedEvent[] {
    return events.slice(0, limit)
}

export function getEventsByTask(taskAddress: string): IndexedEvent[] {
    return (taskEventsMap.get(taskAddress) ?? []).sort(
        (a, b) => a.blockTime - b.blockTime,
    )
}

/** Summary stats for the dashboard */
export function getIndexerStats() {
    const byStatus: Record<string, number> = {}
    for (const t of taskMap.values()) {
        byStatus[t.finalStatus] = (byStatus[t.finalStatus] ?? 0) + 1
    }
    return {
        totalEvents: events.length,
        totalHistoricalTasks: taskMap.size,
        byStatus,
        lastEventTime: events[0]?.blockTime ?? null,
    }
}
