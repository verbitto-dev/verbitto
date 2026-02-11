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
                                                    │ (JSON files)  │
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

A backfill script may be added in a future version.

## API Endpoints

### Webhook

| Method | Path                             | Description                    |
| ------ | -------------------------------- | ------------------------------ |
| POST   | `/api/v1/webhook/helius`         | Receive Helius webhook payload |
| GET    | `/api/v1/webhook/status`         | Indexer health & stats         |
| GET    | `/api/v1/webhook/events?limit=N` | Recent raw events (debug)      |

### History

| Method | Path                             | Description                   |
| ------ | -------------------------------- | ----------------------------- |
| GET    | `/api/v1/history/tasks`          | List closed tasks (paginated) |
| GET    | `/api/v1/history/tasks/:address` | Single task with event trail  |
| GET    | `/api/v1/history/stats`          | Aggregated indexer statistics |

### Query Parameters for `/api/v1/history/tasks`

| Param   | Example    | Description                                           |
| ------- | ---------- | ----------------------------------------------------- |
| status  | `Approved` | Filter: Approved, Cancelled, Expired, DisputeResolved |
| creator | `Fg6Pa...` | Filter by creator public key                          |
| agent   | `DRpb...`  | Filter by agent public key                            |
| limit   | `100`      | Max results (default 100, max 500)                    |
| offset  | `0`        | Pagination offset                                     |

## Data Persistence

Events are stored in JSON files under the `data/` directory:

- `data/events.json` — Raw event log (append-only)
- `data/historical-tasks.json` — Projected task records

The store flushes to disk every 2 seconds after new events arrive.
The `data/` directory is gitignored.

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

- **Persistence**: For production, replace the JSON file store with
  PostgreSQL or another database.
- **Concurrency**: The current store is single-process. For multi-instance
  deployments, use a shared database.
- **Backfill**: Run the backfill script before going live to capture
  all pre-webhook events.
- **Monitoring**: Poll `/api/v1/webhook/status` from your monitoring system.
