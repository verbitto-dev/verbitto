'use client'

import { useConnection } from '@solana/wallet-adapter-react'
import type { Connection, PublicKey } from '@solana/web3.js'
import { useCallback, useEffect, useState } from 'react'
import {
  fetchHistoricalTasks,
  fetchIndexerStats,
  type HistoricalTask,
  type IndexerStats,
} from '@/lib/api'
import {
  decodePlatform,
  decodeTask,
  getPlatformPda,
  type PlatformAccount,
  PROGRAM_ID,
  type TaskAccount,
} from '@/lib/program'

// ============================================================
// usePlatform — fetch the singleton Platform PDA
// ============================================================

export function usePlatform() {
  const { connection } = useConnection()
  const [platform, setPlatform] = useState<PlatformAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const pda = getPlatformPda()
      const info = await connection.getAccountInfo(pda)
      if (info) {
        setPlatform(decodePlatform(Buffer.from(info.data)))
      } else {
        setPlatform(null)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch platform')
    } finally {
      setLoading(false)
    }
  }, [connection])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { platform, loading, error, refetch: fetch }
}

// ============================================================
// useTasks — fetch all Task accounts via getProgramAccounts
// ============================================================

// Task discriminator: first 8 bytes of sha256("account:Task") - from IDL
const TASK_DISCRIMINATOR = Buffer.from([79, 34, 229, 55, 88, 90, 55, 84])

async function fetchAllTasks(connection: Connection): Promise<TaskAccount[]> {
  const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
    filters: [
      { memcmp: { offset: 0, bytes: TASK_DISCRIMINATOR.toString('base64'), encoding: 'base64' } },
    ],
  })

  return accounts
    .map(({ pubkey, account }) => {
      try {
        return decodeTask(pubkey, Buffer.from(account.data))
      } catch {
        return null
      }
    })
    .filter((t): t is TaskAccount => t !== null)
    .sort((a, b) => Number(b.createdAt - a.createdAt))
}

export function useTasks() {
  const { connection } = useConnection()
  const [tasks, setTasks] = useState<TaskAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setTasks(await fetchAllTasks(connection))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch tasks')
    } finally {
      setLoading(false)
    }
  }, [connection])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { tasks, loading, error, refetch: fetch }
}

// ============================================================
// Helper: shorten pubkey for display
// ============================================================

export function shortKey(key: PublicKey | string, len = 4): string {
  const s = typeof key === 'string' ? key : key.toBase58()
  return `${s.slice(0, len)}…${s.slice(-len)}`
}

// ============================================================
// Helper: lamports to SOL display string
// ============================================================

export function lamportsToSol(lamports: bigint): string {
  const sol = Number(lamports) / 1e9
  return sol % 1 === 0 ? sol.toFixed(0) : sol.toFixed(2)
}

// ============================================================
// Helper: format timestamp
// ============================================================

export function formatDeadline(deadline: bigint): string {
  const now = Math.floor(Date.now() / 1000)
  const diff = Number(deadline) - now

  if (diff <= 0) return 'Expired'
  if (diff < 3600) return `${Math.floor(diff / 60)}m left`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h left`
  return `${Math.floor(diff / 86400)}d left`
}

// ============================================================
// useHistoricalTasks — fetch closed tasks from event indexer API
// ============================================================

export type { HistoricalTask } from '@/lib/api'

export function useHistoricalTasks(params?: { status?: string; creator?: string; agent?: string }) {
  const [tasks, setTasks] = useState<HistoricalTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchHistoricalTasks({
        ...params,
        limit: 500,
      })
      setTasks(result.tasks)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch historical tasks')
    } finally {
      setLoading(false)
    }
  }, [params?.status, params?.creator, params?.agent, params])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { tasks, loading, error, refetch: fetch }
}

// ============================================================
// useIndexerStats — fetch event indexer aggregated stats
// ============================================================

export function useIndexerStats() {
  const [stats, setStats] = useState<IndexerStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchIndexerStats()
      setStats(data)
    } catch {
      // Silent fail — indexer may not be running
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { stats, loading, refetch: fetch }
}
