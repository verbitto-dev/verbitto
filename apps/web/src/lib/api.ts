/**
 * API client for the Verbitto API server.
 *
 * Used to fetch historical task data from the event indexer.
 * The API URL defaults to the same origin (API and web may share a host in dev)
 * or can be set via NEXT_PUBLIC_API_URL environment variable.
 */

const API_BASE =
    (typeof window !== 'undefined'
        ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')
        : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')
    ).replace(/\/$/, '')

// ── Historical Task types ──

export interface HistoricalTask {
    address: string
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
    const url = new URL(`${API_BASE}/api/v1/history/tasks`)
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

export async function fetchHistoricalTask(
    address: string,
): Promise<HistoricalTaskDetail | null> {
    try {
        const res = await fetch(`${API_BASE}/api/v1/history/tasks/${address}`)
        if (!res.ok) return null
        return await res.json()
    } catch {
        return null
    }
}

export async function fetchIndexerStats(): Promise<IndexerStats | null> {
    try {
        const res = await fetch(`${API_BASE}/api/v1/history/stats`)
        if (!res.ok) return null
        return await res.json()
    } catch {
        return null
    }
}
