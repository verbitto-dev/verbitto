# Event Indexer — Helius Webhook Setup

The Verbitto API includes an event indexer that captures on-chain Anchor events
via [Helius](https://www.helius.dev/) webhooks. This is essential for serving
historical task data after account PDAs are closed (Approved, Cancelled,
Expired, DisputeResolved states).

## Architecture

```
┌──────────────┐    POST /api/v1/webhook/helius     ┌──────────────┐
│    Helius     │ ─────────────────────────────────> │  Verbitto    │
│  Webhook      │    (Anchor event logs)             │  API Server  │
└──────────────┘                                     └──────┬───────┘
                                                           │
                                                    ┌──────▼───────┐
                                                    │ Event Parser  │
                                                    │ (Anchor logs) │
                                                    └──────┬───────┘
                                                           │
                                                    ┌──────▼───────┐
                                                    │ Event Store   │
                                                    │ (PostgreSQL + │
                                                    │  Drizzle ORM) │
                                                    └──────┬───────┘
                                                           │
                                              ┌────────────┼────────────┐
                                              │            │            │
                                        GET /history  GET /history  GET /webhook
                                          /tasks       /stats       /status
```

## Prerequisites

1. A Helius account (free tier is sufficient for devnet)
2. Your API server must be publicly accessible (Helius sends POST requests)

## Setup Steps

### 1. Get a Helius API Key

Sign up at [helius.dev](https://www.helius.dev/) and create an API key.

### 2. Configure Environment Variables

Add to your `.env` file:

```bash
HELIUS_API_KEY=your-helius-api-key
HELIUS_WEBHOOK_SECRET=any-secure-random-string
```

Generate a secure random secret:

```bash
openssl rand -hex 32
```

### 3. Register the Webhook with Helius

Use the Helius Dashboard or API to register a webhook:

**Via Helius API:**

```bash
curl -X POST "https://api.helius.xyz/v0/webhooks?api-key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "webhookURL": "https://your-api-domain.com/api/v1/webhook/helius?token=YOUR_WEBHOOK_SECRET",
    "transactionTypes": ["ANY"],
    "accountAddresses": ["Coxgjx4UMQZPRdDZT9CAdrvt4TMTyUKH79ziJiNFHk8S"],
    "webhookType": "raw",
    "encoding": "jsonParsed"
  }'
```

**Key parameters:**
- `webhookURL` — Your API endpoint with auth token as query param
- `accountAddresses` — The Verbitto Program ID
- `webhookType` — Use `"raw"` to get full transaction logs (required for Anchor event parsing)
- `transactionTypes` — `"ANY"` to capture all program interactions

### 4. Verify the Webhook

Check the indexer status:

```bash
curl http://localhost:3001/api/v1/webhook/status
```

Should return:
```json
{
  "ok": true,
  "totalEvents": 0,
  "totalHistoricalTasks": 0,
  "byStatus": {},
  "lastEventTime": null,
  "webhookConfigured": true
}
```

### 5. Backfill Historical Events (Optional)

For events that occurred before the webhook was set up, you can use the
Helius Transaction History API to fetch past transactions and replay them:

```bash
# Fetch transaction signatures for the program
curl "https://api.helius.xyz/v0/addresses/Coxgjx4UMQZPRdDZT9CAdrvt4TMTyUKH79ziJiNFHk8S/transactions?api-key=YOUR_API_KEY&type=UNKNOWN" \
  | jq '.'

# Then POST each transaction to your webhook endpoint for processing
```

A backfill endpoint is available to replay missed events:

```bash
# Backfill historical events from Helius
curl -X POST http://localhost:3001/api/v1/history/backfill
```

## API Endpoints

### Webhook

| Method | Path                             | Description                    |
| ------ | -------------------------------- | ------------------------------ |
| POST   | `/api/v1/webhook/helius`         | Receive Helius webhook payload |
| GET    | `/api/v1/webhook/status`         | Indexer health & stats         |
| GET    | `/api/v1/webhook/events?limit=N` | Recent raw events (debug)      |

### History

| Method | Path                             | Description                    |
| ------ | -------------------------------- | ------------------------------ |
| GET    | `/api/v1/history/tasks`          | List closed tasks (paginated)  |
| GET    | `/api/v1/history/tasks/:address` | Single task with event trail   |
| GET    | `/api/v1/history/stats`          | Aggregated indexer statistics  |
| POST   | `/api/v1/history/backfill`       | Replay events from Helius API  |

### Descriptions

| Method | Path                                    | Description               |
| ------ | --------------------------------------- | ------------------------- |
| POST   | `/api/v1/descriptions`                  | Store a task description  |
| GET    | `/api/v1/descriptions/:descriptionHash` | Retrieve by hash          |

### Query Parameters for `/api/v1/history/tasks`

| Param   | Example    | Description                                           |
| ------- | ---------- | ----------------------------------------------------- |
| status  | `Approved` | Filter: Approved, Cancelled, Expired, DisputeResolved |
| creator | `Fg6Pa...` | Filter by creator public key                          |
| agent   | `DRpb...`  | Filter by agent public key                            |
| limit   | `100`      | Max results (default 100, max 500)                    |
| offset  | `0`        | Pagination offset                                     |

## Data Persistence

Events are stored in PostgreSQL via Drizzle ORM across four tables:

| Table | Description |
|-------|-------------|
| `indexed_events` | Raw event log (append-only, with signature, slot, timestamp) |
| `historical_tasks` | Projected task records for closed accounts |
| `task_descriptions` | Off-chain task descriptions keyed by SHA-256 hash |
| `task_titles` | Extracted task titles keyed by task address |

### Database Setup

```bash
# Set connection string
export DATABASE_URL="postgresql://user:password@localhost:5432/verbitto"

# Push schema to database
cd apps/api && npx drizzle-kit push
```

The schema is defined in `apps/api/src/db/schema.ts` and migrations are
managed via `drizzle-kit`.

## Events Indexed

All 14 Anchor events emitted by the task-escrow program:

| Event                | Terminal? | Description                  |
| -------------------- | --------- | ---------------------------- |
| PlatformInitialized  | No        | Platform singleton created   |
| TaskCreated          | No        | New task with bounty         |
| TaskClaimed          | No        | Agent claims a task          |
| DeliverableSubmitted | No        | Agent submits work           |
| TaskSettled          | **Yes**   | Task approved, agent paid    |
| SubmissionRejected   | No        | Creator rejects submission   |
| TaskCancelled        | **Yes**   | Creator cancels open task    |
| TaskExpired          | **Yes**   | Cranker expires overdue task |
| TemplateCreated      | No        | Template registered          |
| DisputeOpened        | No        | Dispute raised               |
| VoteCast             | No        | Arbitrator votes             |
| DisputeResolved      | **Yes**   | Dispute finalised            |
| AgentRegistered      | No        | New agent profile            |
| AgentProfileUpdated  | No        | Reputation change            |

Terminal events trigger account closure. The indexer reconstructs the task's
history from all related events and stores it as a `HistoricalTask`.

## Production Considerations

- **Database**: PostgreSQL is the default storage backend via Drizzle ORM.
  Set `DATABASE_URL` in your environment.
- **Concurrency**: The PostgreSQL store supports multi-instance deployments
  with proper connection pooling.
- **Backfill**: Use `POST /api/v1/history/backfill` before going live to
  capture all pre-webhook events from the Helius API.
- **Monitoring**: Poll `/api/v1/webhook/status` from your monitoring system.
