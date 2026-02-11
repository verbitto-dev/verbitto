/**
 * Anchor Event Parser — extracts typed events from Helius webhook payloads.
 *
 * Anchor emits events as `Program data: <base64>` in transaction logs.
 * The base64 payload is: 8-byte discriminator + borsh-serialized fields.
 * Discriminator = sha256("event:<EventName>")[0..8]
 *
 * Supports both Helius "raw" and "enhanced" webhook formats.
 */

import { createHash } from 'node:crypto'
import { PublicKey } from '@solana/web3.js'
import type { IndexedEvent } from './event-store.js'

// ────────────────────────────────────────────────────────────
// Program ID
// ────────────────────────────────────────────────────────────

const PROGRAM_ID =
    process.env.SOLANA_PROGRAM_ID || 'Coxgjx4UMQZPRdDZT9CAdrvt4TMTyUKH79ziJiNFHk8S'

// ────────────────────────────────────────────────────────────
// Event discriminator computation
// ────────────────────────────────────────────────────────────

function eventDiscriminator(name: string): Buffer {
    return Buffer.from(
        createHash('sha256').update(`event:${name}`).digest().subarray(0, 8),
    )
}

// ────────────────────────────────────────────────────────────
// Event definitions: name → decoder
// ────────────────────────────────────────────────────────────

type EventDecoder = (buf: Buffer) => Record<string, string>

function readPubkey(buf: Buffer, offset: number): [string, number] {
    return [new PublicKey(buf.subarray(offset, offset + 32)).toBase58(), offset + 32]
}

function readU64(buf: Buffer, offset: number): [string, number] {
    return [buf.readBigUInt64LE(offset).toString(), offset + 8]
}

function readI64(buf: Buffer, offset: number): [string, number] {
    return [buf.readBigInt64LE(offset).toString(), offset + 8]
}

function readU16(buf: Buffer, offset: number): [string, number] {
    return [buf.readUInt16LE(offset).toString(), offset + 2]
}

function readU8(buf: Buffer, offset: number): [string, number] {
    return [buf.readUInt8(offset).toString(), offset + 1]
}

function readHash32(buf: Buffer, offset: number): [string, number] {
    return [
        Buffer.from(buf.subarray(offset, offset + 32)).toString('hex'),
        offset + 32,
    ]
}

const EVENT_DECODERS: Record<string, EventDecoder> = {
    PlatformInitialized: (buf) => {
        let o = 0
        const [authority, o1] = readPubkey(buf, o); o = o1
        const [fee_bps, o2] = readU16(buf, o); o = o2
        const [treasury, o3] = readPubkey(buf, o); o = o3
        return { authority, fee_bps, treasury }
    },

    TaskCreated: (buf) => {
        let o = 0
        const [task, o1] = readPubkey(buf, o); o = o1
        const [creator, o2] = readPubkey(buf, o); o = o2
        const [task_index, o3] = readU64(buf, o); o = o3
        const [bounty_lamports, o4] = readU64(buf, o); o = o4
        const [deadline, o5] = readI64(buf, o); o = o5
        return { task, creator, task_index, bounty_lamports, deadline }
    },

    TaskClaimed: (buf) => {
        let o = 0
        const [task, o1] = readPubkey(buf, o); o = o1
        const [agent, o2] = readPubkey(buf, o); o = o2
        const [task_index, o3] = readU64(buf, o); o = o3
        return { task, agent, task_index }
    },

    DeliverableSubmitted: (buf) => {
        let o = 0
        const [task, o1] = readPubkey(buf, o); o = o1
        const [agent, o2] = readPubkey(buf, o); o = o2
        const [deliverable_hash, o3] = readHash32(buf, o); o = o3
        return { task, agent, deliverable_hash }
    },

    TaskSettled: (buf) => {
        let o = 0
        const [task, o1] = readPubkey(buf, o); o = o1
        const [agent, o2] = readPubkey(buf, o); o = o2
        const [payout_lamports, o3] = readU64(buf, o); o = o3
        const [fee_lamports, o4] = readU64(buf, o); o = o4
        return { task, agent, payout_lamports, fee_lamports }
    },

    SubmissionRejected: (buf) => {
        let o = 0
        const [task, o1] = readPubkey(buf, o); o = o1
        const [agent, o2] = readPubkey(buf, o); o = o2
        const [reason_hash, o3] = readHash32(buf, o); o = o3
        return { task, agent, reason_hash }
    },

    TaskCancelled: (buf) => {
        let o = 0
        const [task, o1] = readPubkey(buf, o); o = o1
        const [creator, o2] = readPubkey(buf, o); o = o2
        const [refunded_lamports, o3] = readU64(buf, o); o = o3
        return { task, creator, refunded_lamports }
    },

    TaskExpired: (buf) => {
        let o = 0
        const [task, o1] = readPubkey(buf, o); o = o1
        const [creator, o2] = readPubkey(buf, o); o = o2
        const [refunded_lamports, o3] = readU64(buf, o); o = o3
        return { task, creator, refunded_lamports }
    },

    TemplateCreated: (buf) => {
        let o = 0
        const [template, o1] = readPubkey(buf, o); o = o1
        const [creator, o2] = readPubkey(buf, o); o = o2
        const [template_index, o3] = readU64(buf, o); o = o3
        const [category, o4] = readU8(buf, o); o = o4
        return { template, creator, template_index, category }
    },

    DisputeOpened: (buf) => {
        let o = 0
        const [dispute, o1] = readPubkey(buf, o); o = o1
        const [task, o2] = readPubkey(buf, o); o = o2
        const [initiator, o3] = readPubkey(buf, o); o = o3
        const [reason, o4] = readU8(buf, o); o = o4
        return { dispute, task, initiator, reason }
    },

    VoteCast: (buf) => {
        let o = 0
        const [dispute, o1] = readPubkey(buf, o); o = o1
        const [voter, o2] = readPubkey(buf, o); o = o2
        const [ruling, o3] = readU8(buf, o); o = o3
        return { dispute, voter, ruling }
    },

    DisputeResolved: (buf) => {
        let o = 0
        const [dispute, o1] = readPubkey(buf, o); o = o1
        const [task, o2] = readPubkey(buf, o); o = o2
        const [ruling, o3] = readU8(buf, o); o = o3
        const [total_votes, o4] = readU16(buf, o); o = o4
        return { dispute, task, ruling, total_votes }
    },

    AgentRegistered: (buf) => {
        let o = 0
        const [agent, o1] = readPubkey(buf, o); o = o1
        const [profile, o2] = readPubkey(buf, o); o = o2
        return { agent, profile }
    },

    AgentProfileUpdated: (buf) => {
        let o = 0
        const [agent, o1] = readPubkey(buf, o); o = o1
        const [reputation_score, o2] = readI64(buf, o); o = o2
        const [tasks_completed, o3] = readU64(buf, o); o = o3
        return { agent, reputation_score, tasks_completed }
    },
}

// Build discriminator → event name map
const DISC_MAP = new Map<string, string>()
for (const name of Object.keys(EVENT_DECODERS)) {
    const disc = eventDiscriminator(name)
    DISC_MAP.set(disc.toString('hex'), name)
}

// ────────────────────────────────────────────────────────────
// Log parser: extract events from "Program data:" entries
// ────────────────────────────────────────────────────────────

/**
 * Parse Anchor events from an array of transaction log messages.
 * Returns decoded events (only those matching our program's event discriminators).
 */
export function parseEventsFromLogs(
    logMessages: string[],
    signature: string,
    slot: number,
    blockTime: number,
): IndexedEvent[] {
    const results: IndexedEvent[] = []

    // Track program invocation depth to attribute "Program data:" to our program
    let insideOurProgram = false

    for (const line of logMessages) {
        // Detect program invocation
        if (line.startsWith(`Program ${PROGRAM_ID} invoke`)) {
            insideOurProgram = true
            continue
        }
        if (line.startsWith(`Program ${PROGRAM_ID} success`) ||
            line.startsWith(`Program ${PROGRAM_ID} failed`)) {
            insideOurProgram = false
            continue
        }

        // Only process "Program data:" lines when inside our program
        if (!insideOurProgram) continue
        if (!line.startsWith('Program data: ')) continue

        const b64 = line.slice('Program data: '.length).trim()
        let raw: Buffer
        try {
            raw = Buffer.from(b64, 'base64')
        } catch {
            continue
        }

        if (raw.length < 8) continue

        // Match discriminator
        const discHex = raw.subarray(0, 8).toString('hex')
        const eventName = DISC_MAP.get(discHex)
        if (!eventName) continue

        const decoder = EVENT_DECODERS[eventName]
        if (!decoder) continue

        try {
            const data = decoder(raw.subarray(8))
            results.push({ signature, slot, blockTime, eventName, data })
        } catch (err) {
            console.warn(`[EventParser] Failed to decode ${eventName}:`, err)
        }
    }

    return results
}

// ────────────────────────────────────────────────────────────
// Helius webhook payload parsers
// ────────────────────────────────────────────────────────────

/**
 * Helius "raw" webhook transaction shape (subset).
 */
interface HeliusRawTx {
    transaction: {
        signatures: string[]
        message?: unknown
    }
    meta: {
        err: unknown
        logMessages?: string[]
    }
    slot: number
    blockTime?: number
}

/**
 * Helius "enhanced" webhook transaction shape (subset).
 * Enhanced format puts some data at top level.
 */
interface HeliusEnhancedTx {
    signature: string
    slot: number
    timestamp: number
    type?: string
    /** Enhanced txns can include native log messages too */
    nativeTransfers?: unknown[]
    events?: unknown
    /** We need the raw transaction to get logs */
    transaction?: {
        meta?: {
            logMessages?: string[]
        }
    }
}

/**
 * Parse events from a Helius webhook payload.
 * Accepts both raw and enhanced formats (array of transactions).
 */
export function parseHeliusPayload(payload: unknown): IndexedEvent[] {
    const allEvents: IndexedEvent[] = []

    if (!Array.isArray(payload)) {
        console.warn('[EventParser] Payload is not an array')
        return allEvents
    }

    for (const item of payload) {
        try {
            const events = parseOneTransaction(item)
            allEvents.push(...events)
        } catch (err) {
            console.warn('[EventParser] Failed to parse transaction:', err)
        }
    }

    return allEvents
}

function parseOneTransaction(tx: unknown): IndexedEvent[] {
    if (!tx || typeof tx !== 'object') return []

    const obj = tx as Record<string, unknown>

    // Try raw format first
    if (obj.meta && typeof obj.meta === 'object') {
        const raw = tx as HeliusRawTx
        const logMessages = raw.meta?.logMessages ?? []
        const signature = raw.transaction?.signatures?.[0] ?? ''
        const slot = raw.slot ?? 0
        const blockTime = raw.blockTime ?? Math.floor(Date.now() / 1000)

        if (logMessages.length > 0 && signature) {
            return parseEventsFromLogs(logMessages, signature, slot, blockTime)
        }
    }

    // Try enhanced format
    if (obj.signature && typeof obj.signature === 'string') {
        const enhanced = tx as HeliusEnhancedTx
        const logMessages =
            enhanced.transaction?.meta?.logMessages ?? []
        const signature = enhanced.signature
        const slot = enhanced.slot ?? 0
        const blockTime = enhanced.timestamp ?? Math.floor(Date.now() / 1000)

        if (logMessages.length > 0) {
            return parseEventsFromLogs(logMessages, signature, slot, blockTime)
        }
    }

    return []
}

// ────────────────────────────────────────────────────────────
// Instruction data parser: extract title from create_task ix
// ────────────────────────────────────────────────────────────

/** Anchor instruction discriminator = sha256("global:<method_name>")[0..8] */
function ixDiscriminator(name: string): Buffer {
    return Buffer.from(
        createHash('sha256').update(`global:${name}`).digest().subarray(0, 8),
    )
}

const CREATE_TASK_DISC = ixDiscriminator('create_task')
const CREATE_TASK_FROM_TEMPLATE_DISC = ixDiscriminator('create_task_from_template')

/**
 * Extract task titles from create_task instruction data in a transaction.
 * Returns a map of task PDA address → title string.
 *
 * Works with versioned transactions (maxSupportedTransactionVersion: 0).
 */
export function extractTitlesFromTx(
    tx: {
        transaction: { message: { compiledInstructions?: Array<{ programIdIndex: number; data: Uint8Array; accountKeyIndexes?: number[] }>; instructions?: Array<{ programIdIndex: number; data: string; accounts?: number[] }>; staticAccountKeys?: Array<{ toBase58(): string }>; accountKeys?: Array<{ toBase58(): string }> } }
    },
): Map<string, string> {
    const titles = new Map<string, string>()

    const msg = tx.transaction.message
    const accountKeys = (msg.staticAccountKeys ?? msg.accountKeys ?? []) as Array<{ toBase58(): string }>

    // Find our program's index in account keys
    const programIdx = accountKeys.findIndex((k) => k.toBase58() === PROGRAM_ID)
    if (programIdx === -1) return titles

    // Handle compiled instructions (versioned tx) and legacy instructions
    const instructions = msg.compiledInstructions ?? msg.instructions ?? []

    for (const ix of instructions) {
        if (ix.programIdIndex !== programIdx) continue

        let ixData: Buffer
        if (ix.data instanceof Uint8Array) {
            ixData = Buffer.from(ix.data)
        } else if (typeof ix.data === 'string') {
            // Legacy format: base58 encoded
            ixData = Buffer.from(ix.data, 'base64')
        } else {
            continue
        }

        if (ixData.length < 12) continue // need at least disc(8) + title_len(4)

        const disc = ixData.subarray(0, 8)
        const isCreateTask = disc.equals(CREATE_TASK_DISC)
        const isFromTemplate = disc.equals(CREATE_TASK_FROM_TEMPLATE_DISC)
        if (!isCreateTask && !isFromTemplate) continue

        try {
            // create_task args: title(String), description_hash([u8;32]), ...
            // Borsh String = u32 LE length + utf8 bytes
            const titleLen = ixData.readUInt32LE(8)
            if (titleLen > 64 || titleLen === 0) continue // sanity
            if (ixData.length < 12 + titleLen) continue
            const title = ixData.subarray(12, 12 + titleLen).toString('utf8')

            // We need the task account from the instruction's accounts list.
            // Anchor account order for CreateTask: [task, creator_counter, platform, creator, system_program]
            // Task PDA is at index 0 in the instruction accounts.
            const accountIndexes = (ix as { accountKeyIndexes?: number[] }).accountKeyIndexes ??
                (ix as { accounts?: number[] }).accounts ?? []
            if (accountIndexes.length > 0) {
                const taskAccIdx = accountIndexes[0]
                if (taskAccIdx < accountKeys.length) {
                    const taskAddr = accountKeys[taskAccIdx].toBase58()
                    titles.set(taskAddr, title)
                }
            }
        } catch {
            // Parsing failed, skip
        }
    }

    return titles
}
