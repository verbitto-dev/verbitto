import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema.js'

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/verbitto'

/** Underlying postgres.js client */
const client = postgres(DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
})

/** Drizzle ORM instance */
export const db = drizzle(client, { schema })

/** Test the database connection */
export async function testConnection(): Promise<boolean> {
    try {
        await client`SELECT 1`
        return true
    } catch (err) {
        console.error('[DB] Connection failed:', err)
        return false
    }
}

/** Close the database connection pool */
export async function closeDb(): Promise<void> {
    await client.end()
}
