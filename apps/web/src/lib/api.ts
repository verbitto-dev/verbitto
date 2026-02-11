/**
 * API client for the Verbitto API server.
 *
 * Used to fetch historical task data from the event indexer.
 * The API URL defaults to the same origin (API and web may share a host in dev)
 * or can be set via NEXT_PUBLIC_API_URL environment variable.
 */

const API_BASE = (
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
).replace(/\/$/, '')

// ── Historical Task types ──

export interface HistoricalTask {
  address: string
  title: string
  descriptionHash?: string
  description?: string | null
  creator: string
  taskIndex: string
  bountyLamports: string
  bountySol: number
  deadline: number
  finalStatus: 'Approved' | 'Cancelled' | 'Expired' | 'DisputeResolved'
  agent: string
  payoutLamports: string
  feeLamports: string
  refundedLamports: string
  createdAt: number
  closedAt: number
}

export interface HistoricalTaskDetail extends HistoricalTask {
  events: Array<{
    signature: string
    slot: number
    blockTime: number
    eventName: string
    data: Record<string, string>
  }>
}

export interface IndexerStats {
  totalEvents: number
  totalHistoricalTasks: number
  byStatus: Record<string, number>
  lastEventTime: number | null
  approvedCount: number
  cancelledCount: number
  expiredCount: number
  disputeResolvedCount: number
}

// ── API calls ──

export async function fetchHistoricalTasks(params?: {
  status?: string
  creator?: string
  agent?: string
  limit?: number
  offset?: number
}): Promise<{ tasks: HistoricalTask[]; total: number }> {
  const url = new URL(`${API_BASE}/v1/history/tasks`)
  if (params?.status) url.searchParams.set('status', params.status)
  if (params?.creator) url.searchParams.set('creator', params.creator)
  if (params?.agent) url.searchParams.set('agent', params.agent)
  if (params?.limit) url.searchParams.set('limit', String(params.limit))
  if (params?.offset) url.searchParams.set('offset', String(params.offset))

  try {
    const res = await fetch(url.toString())
    if (!res.ok) return { tasks: [], total: 0 }
    return await res.json()
  } catch {
    console.warn('[API] Failed to fetch historical tasks')
    return { tasks: [], total: 0 }
  }
}

export async function fetchHistoricalTask(address: string): Promise<HistoricalTaskDetail | null> {
  try {
    const res = await fetch(`${API_BASE}/v1/history/tasks/${address}`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function fetchIndexerStats(): Promise<IndexerStats | null> {
  try {
    const res = await fetch(`${API_BASE}/v1/history/stats`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// ── Backfill ──

export interface BackfillResult {
  ok: boolean
  signaturesScanned: number
  transactionsFetched: number
  eventsParsed: number
  eventsIngested: number
  errors: number
  durationMs: number
}

/**
 * Trigger an RPC backfill to populate the event store with
 * historical transactions that the Helius webhook may have missed.
 */
export async function triggerBackfill(limit?: number): Promise<BackfillResult> {
  const res = await fetch(`${API_BASE}/v1/history/backfill`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ limit: limit ?? 500 }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error || `Backfill failed (${res.status})`)
  }

  return res.json()
}

// ── Descriptions ──

export interface TaskDescription {
  descriptionHash: string
  content: string
  taskAddress: string | null
  creator: string | null
}

/**
 * Store a task description in the API database (pre-IPFS).
 */
export async function storeDescription(params: {
  descriptionHash: string
  content: string
  taskAddress?: string
  creator?: string
}): Promise<TaskDescription> {
  const res = await fetch(`${API_BASE}/v1/descriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error || `Failed to store description (${res.status})`)
  }

  return res.json()
}

/**
 * Fetch a task description by its SHA-256 hash.
 */
export async function fetchDescription(hash: string): Promise<TaskDescription | null> {
  try {
    const res = await fetch(`${API_BASE}/v1/descriptions/${hash}`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}
