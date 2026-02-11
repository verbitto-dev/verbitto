/**
 * Run database migrations using Drizzle push (schema sync).
 * For production, use `drizzle-kit generate` + `drizzle-kit migrate` instead.
 */

import { sql } from 'drizzle-orm'
import { db, testConnection } from './index.js'

export async function migrateDb(): Promise<void> {
  const ok = await testConnection()
  if (!ok) {
    console.error('[DB] Cannot run migrations — database is not reachable')
    return
  }

  // Create tables if they don't exist (schema push via raw SQL)
  await db.execute(sql`
        CREATE TABLE IF NOT EXISTS indexed_events (
            id TEXT PRIMARY KEY,
            signature TEXT NOT NULL,
            slot INTEGER NOT NULL,
            block_time INTEGER NOT NULL,
            event_name TEXT NOT NULL,
            data JSONB NOT NULL,
            task_address TEXT,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
    `)

  await db.execute(sql`
        CREATE TABLE IF NOT EXISTS historical_tasks (
            address TEXT PRIMARY KEY,
            title TEXT NOT NULL DEFAULT '',
            creator TEXT NOT NULL,
            task_index TEXT NOT NULL DEFAULT '',
            bounty_lamports TEXT NOT NULL DEFAULT '0',
            deadline INTEGER NOT NULL DEFAULT 0,
            final_status TEXT NOT NULL,
            agent TEXT NOT NULL DEFAULT '',
            payout_lamports TEXT NOT NULL DEFAULT '0',
            fee_lamports TEXT NOT NULL DEFAULT '0',
            refunded_lamports TEXT NOT NULL DEFAULT '0',
            created_at INTEGER NOT NULL DEFAULT 0,
            closed_at INTEGER NOT NULL DEFAULT 0,
            updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
    `)

  await db.execute(sql`
        CREATE TABLE IF NOT EXISTS task_descriptions (
            description_hash TEXT PRIMARY KEY,
            content TEXT NOT NULL,
            task_address TEXT,
            creator TEXT,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
    `)

  await db.execute(sql`
        CREATE TABLE IF NOT EXISTS task_titles (
            task_address TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
    `)

  // Create indexes (IF NOT EXISTS)
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_events_task_address ON indexed_events(task_address)`
  )
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_events_event_name ON indexed_events(event_name)`
  )
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_events_block_time ON indexed_events(block_time)`
  )
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_events_signature ON indexed_events(signature)`
  )
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_hist_creator ON historical_tasks(creator)`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_hist_agent ON historical_tasks(agent)`)
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_hist_final_status ON historical_tasks(final_status)`
  )
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_hist_closed_at ON historical_tasks(closed_at)`
  )
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_desc_task_address ON task_descriptions(task_address)`
  )
}
