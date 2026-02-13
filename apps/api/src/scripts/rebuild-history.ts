#!/usr/bin/env node
/**
 * One-time script to rebuild historical tasks from existing event data.
 * Run this to fix missing historical task records.
 */

import { rebuildHistoricalTasks } from '../lib/event-store.js'

async function main() {
    console.log('[RebuildHistory] Starting to rebuild historical tasks...')
    try {
        await rebuildHistoricalTasks()
        console.log('[RebuildHistory] Successfully rebuilt historical tasks')
        process.exit(0)
    } catch (err) {
        console.error('[RebuildHistory] Failed:', err)
        process.exit(1)
    }
}

main()
