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
    await getClient()`SELECT 1`
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
