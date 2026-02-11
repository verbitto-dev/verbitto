import { index, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

// ────────────────────────────────────────────────────────────
// indexed_events — raw Anchor events from program transactions
// ────────────────────────────────────────────────────────────

export const indexedEvents = pgTable(
  'indexed_events',
  {
    /** Composite dedup key: signature + eventName */
    id: text('id').primaryKey(),
    /** Transaction signature */
    signature: text('signature').notNull(),
    /** Slot number */
    slot: integer('slot').notNull(),
    /** Block unix timestamp */
    blockTime: integer('block_time').notNull(),
    /** Anchor event name, e.g. "TaskCreated" */
    eventName: text('event_name').notNull(),
    /** Parsed event fields (all values stringified) */
    data: jsonb('data').notNull().$type<Record<string, string>>(),
    /** Task PDA address (extracted from data.task for indexing) */
    taskAddress: text('task_address'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('idx_events_task_address').on(t.taskAddress),
    index('idx_events_event_name').on(t.eventName),
    index('idx_events_block_time').on(t.blockTime),
    index('idx_events_signature').on(t.signature),
  ]
)

// ────────────────────────────────────────────────────────────
// historical_tasks — projected from terminal events
// ────────────────────────────────────────────────────────────

export const historicalTasks = pgTable(
  'historical_tasks',
  {
    /** Task PDA base58 address */
    address: text('address').primaryKey(),
    /** Task title from create_task instruction data */
    title: text('title').notNull().default(''),
    /** SHA-256 hash of the description (hex) */
    descriptionHash: text('description_hash').notNull().default(''),
    /** Creator public key */
    creator: text('creator').notNull(),
    /** Per-creator task index */
    taskIndex: text('task_index').notNull().default(''),
    /** Bounty in lamports */
    bountyLamports: text('bounty_lamports').notNull().default('0'),
    /** Deadline unix timestamp */
    deadline: integer('deadline').notNull().default(0),
    /** Terminal status */
    finalStatus: text('final_status')
      .notNull()
      .$type<'Approved' | 'Cancelled' | 'Expired' | 'DisputeResolved'>(),
    /** Agent public key */
    agent: text('agent').notNull().default(''),
    /** Payout to agent in lamports */
    payoutLamports: text('payout_lamports').notNull().default('0'),
    /** Platform fee in lamports */
    feeLamports: text('fee_lamports').notNull().default('0'),
    /** Refund to creator in lamports */
    refundedLamports: text('refunded_lamports').notNull().default('0'),
    /** blockTime of TaskCreated event */
    createdAt: integer('created_at').notNull().default(0),
    /** blockTime of terminal event */
    closedAt: integer('closed_at').notNull().default(0),

    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('idx_hist_creator').on(t.creator),
    index('idx_hist_agent').on(t.agent),
    index('idx_hist_final_status').on(t.finalStatus),
    index('idx_hist_closed_at').on(t.closedAt),
  ]
)

// ────────────────────────────────────────────────────────────
// task_descriptions — store description text before IPFS
// ────────────────────────────────────────────────────────────

export const taskDescriptions = pgTable(
  'task_descriptions',
  {
    /** SHA-256 hash of the description (hex) — serves as content-addressed key */
    descriptionHash: text('description_hash').primaryKey(),
    /** The full description text */
    content: text('content').notNull(),
    /** Task PDA address (optional, for easier lookup) */
    taskAddress: text('task_address'),
    /** Creator who submitted it */
    creator: text('creator'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('idx_desc_task_address').on(t.taskAddress)]
)

// ────────────────────────────────────────────────────────────
// task_titles — title extracted from instruction data (backfill)
// ────────────────────────────────────────────────────────────

export const taskTitles = pgTable('task_titles', {
  /** Task PDA base58 address */
  taskAddress: text('task_address').primaryKey(),
  /** Task title */
  title: text('title').notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
})
