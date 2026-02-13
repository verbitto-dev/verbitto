import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_6n3vBKLuEVRA@ep-shiny-flower-ajljb8vd-pooler.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require'

const client = postgres(DATABASE_URL)
const db = drizzle(client)

async function checkDb() {
  // Check if tables exist
  const tables = await client`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name
  `
  
  console.log('=== Database Tables ===')
  console.log(tables.map(t => `  - ${t.table_name}`).join('\n'))
  
  // Count records in key tables
  console.log('\n=== Record Counts ===')
  
  try {
    const eventCount = await client`SELECT COUNT(*) FROM indexed_events`
    console.log(`  indexed_events: ${eventCount[0].count}`)
  } catch (e) {
    console.log(`  indexed_events: table not found`)
  }
  
  try {
    const histCount = await client`SELECT COUNT(*) FROM historical_tasks`
    console.log(`  historical_tasks: ${histCount[0].count}`)
  } catch (e) {
    console.log(`  historical_tasks: table not found`)
  }
  
  try {
    const titleCount = await client`SELECT COUNT(*) FROM task_titles`
    console.log(`  task_titles: ${titleCount[0].count}`)
  } catch (e) {
    console.log(`  task_titles: table not found`)
  }
  
  // Check event types
  console.log('\n=== Event Types in DB ===')
  try {
    const eventTypes = await client`
      SELECT event_name, COUNT(*) as count
      FROM indexed_events
      GROUP BY event_name
      ORDER BY count DESC
    `
    eventTypes.forEach(e => {
      console.log(`  ${e.event_name}: ${e.count}`)
    })
  } catch (e) {
    console.log('  Could not query events')
  }
  
  await client.end()
}

checkDb().catch(console.error)
