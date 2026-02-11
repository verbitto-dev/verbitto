/**
 * RPC Backfill — scans on-chain transaction history for the program
 * and ingests Anchor events into the event store.
 *
 * This is the dev/catch-up alternative to the Helius webhook.
 * POST /api/v1/history/backfill triggers this.
 */

import { PublicKey } from '@solana/web3.js'
import type { ConfirmedSignatureInfo, ParsedTransactionWithMeta } from '@solana/web3.js'
import { getConnection } from './solana.js'
import { parseEventsFromLogs, extractTitlesFromTx } from './event-parser.js'
import { ingestEvents, saveStore, rebuildHistoricalTasks, setTaskData } from './event-store.js'

const PROGRAM_ID = new PublicKey(
    process.env.SOLANA_PROGRAM_ID || 'Coxgjx4UMQZPRdDZT9CAdrvt4TMTyUKH79ziJiNFHk8S',
)

/** Max signatures to fetch per getSignaturesForAddress call */
const SIG_BATCH = 100
/** Max transactions to fetch in parallel */
const TX_BATCH = 20
/** Default max signatures to scan (can be overridden via params) */
const DEFAULT_LIMIT = 500

export interface BackfillResult {
    signaturesScanned: number
    transactionsFetched: number
    eventsParsed: number
    eventsIngested: number
    errors: number
    durationMs: number
}

/**
 * Backfill historical events by scanning program transaction history from RPC.
 */
export async function backfillFromRpc(opts?: {
    limit?: number
    before?: string
}): Promise<BackfillResult> {
    const start = Date.now()
    const connection = getConnection()
    const limit = Math.min(opts?.limit ?? DEFAULT_LIMIT, 2000)

    let signaturesScanned = 0
    let transactionsFetched = 0
    let eventsParsed = 0
    let eventsIngested = 0
    let errors = 0

    // ── Step 1: Fetch transaction signatures ──
    const allSigs: ConfirmedSignatureInfo[] = []
    let before: string | undefined = opts?.before

    while (allSigs.length < limit) {
        const batch = await connection.getSignaturesForAddress(
            PROGRAM_ID,
            { limit: Math.min(SIG_BATCH, limit - allSigs.length), before },
            'confirmed',
        )

        if (batch.length === 0) break
        allSigs.push(...batch)
        before = batch[batch.length - 1].signature
    }

    signaturesScanned = allSigs.length
    console.log(`[Backfill] Found ${signaturesScanned} signatures to process`)

    // Filter out errored transactions and reverse to chronological (oldest-first)
    // so TaskCreated is ingested before TaskCancelled/TaskSettled/etc.
    const validSigs = allSigs.filter((s) => s.err === null).reverse()

    // ── Step 2: Fetch transactions in batches and parse events ──
    for (let i = 0; i < validSigs.length; i += TX_BATCH) {
        const batch = validSigs.slice(i, i + TX_BATCH)

        const txResults = await Promise.allSettled(
            batch.map((sig) =>
                connection.getTransaction(sig.signature, {
                    maxSupportedTransactionVersion: 0,
                }),
            ),
        )

        for (let j = 0; j < txResults.length; j++) {
            const result = txResults[j]
            const sig = batch[j]

            if (result.status === 'rejected') {
                errors++
                continue
            }

            const tx = result.value
            if (!tx?.meta?.logMessages) continue

            transactionsFetched++

            const events = parseEventsFromLogs(
                tx.meta.logMessages,
                sig.signature,
                tx.slot,
                tx.blockTime ?? Math.floor(Date.now() / 1000),
            )

            if (events.length > 0) {
                eventsParsed += events.length
                eventsIngested += await ingestEvents(events)
            }

            // Extract task titles and descriptionHashes from create_task instruction data
            try {
                const taskDataMap = extractTitlesFromTx(tx as Parameters<typeof extractTitlesFromTx>[0])
                for (const [taskAddr, data] of taskDataMap) {
                    await setTaskData(taskAddr, data.title, data.descriptionHash)
                }
            } catch {
                // title/hash extraction is best-effort
            }
        }
    }

    // Rebuild historical task projections with complete event trails
    await rebuildHistoricalTasks()

    // Flush (no-op with DB backend, kept for API compatibility)
    await saveStore()

    const durationMs = Date.now() - start
    console.log(
        `[Backfill] Done in ${durationMs}ms: ` +
        `${signaturesScanned} sigs, ${transactionsFetched} txns, ` +
        `${eventsParsed} events parsed, ${eventsIngested} ingested, ${errors} errors`,
    )

    return {
        signaturesScanned,
        transactionsFetched,
        eventsParsed,
        eventsIngested,
        errors,
        durationMs,
    }
}
