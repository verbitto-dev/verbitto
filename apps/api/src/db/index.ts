import { drizzle } from 'drizzle-orm/postgres-js'
import type { Sql } from 'postgres'
import postgres from 'postgres'
import * as schema from './schema.js'

let client: Sql | null = null
let dbInstance: ReturnType<typeof drizzle> | null = null

/** Get or create the postgres.js client */
function getClient() {
  if (!client) {
    const DATABASE_URL =
      process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/verbitto'
    client = postgres(DATABASE_URL, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    })
  }
  return client
}

/** Drizzle ORM instance */
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    if (!dbInstance) {
      dbInstance = drizzle(getClient(), { schema })
    }
    return dbInstance[prop as keyof ReturnType<typeof drizzle>]
  },
})

/** Test the database connection */
export async function testConnection(): Promise<boolean> {
  try {
    console.log('[DB] Testing connection...')
    const testPromise = getClient()`SELECT 1`
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database connection timeout - exceeded 5s')), 5000)
    )

    await Promise.race([testPromise, timeout])
    console.log('[DB] Connection successful')
    return true
  } catch (err) {
    console.error('[DB] Connection failed:', err)
    return false
  }
}

/** Close the database connection pool */
export async function closeDb(): Promise<void> {
  const c = getClient()
  await c.end()
}
