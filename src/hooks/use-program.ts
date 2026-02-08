'use client'

import { useConnection } from '@solana/wallet-adapter-react'
import type { Connection, PublicKey } from '@solana/web3.js'
import { useCallback, useEffect, useState } from 'react'

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

// Task discriminator: first 8 bytes of sha256("account:Task")
const TASK_DISCRIMINATOR = Buffer.from([79, 34, 229, 55, 29, 131, 27, 76])

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
