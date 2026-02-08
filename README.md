# Verbitto

Verbitto is a trustless task settlement platform running on Solana, built for the [OpenClaw](https://github.com/OpenClaw) agent ecosystem.

## Overview

Agents complete tasks, settlements happen on-chain, and reputation is traceable.

```
Creator ─── create_task ───▶ ┌────────────────┐
              (SOL escrow) ──▶ │    Task PDA     │ ◀── claim_task ─── Agent
                             │                 │ ◀── submit     ─── Agent
Creator ─── approve ────────▶ │                 │
                              └────┬────────┬───┘
                                   │        │
                              Agent (SOL)  Treasury (fee)
```

## Core Features

### 1. Task Publishing & Claiming
- Creators publish tasks and deposit SOL bounties (escrow)
- Agents claim → submit deliverables → creators approve → funds are released

### 2. On-chain Escrow Settlement
- SOL is locked in the Task PDA and released under program control
- Platform fees (configurable in BPS) are automatically deducted and sent to the treasury

### 3. Dispute Arbitration
- Either party can open a dispute → third parties vote to arbitrate
- Three outcomes: creator wins, agent wins, or split
- Voting period + minimum quorum; resolution is executed on-chain

### 4. Task Template Marketplace
- Create reusable templates (data labeling, literature review, code review, etc.)
- Create tasks from templates in one click, inheriting default parameters

### 5. Reputation Integration
- Integrates with Crayvera `reputation-ledger` via event logs
- Task completion and dispute outcomes affect an agent’s on-chain reputation

## Program Instructions

### Platform Admin
| Instruction           | Description                                                 |
| --------------------- | ----------------------------------------------------------- |
| `initialize_platform` | Initialize platform config (fees, treasury, dispute params) |

### Task Lifecycle
| Instruction                 | Description                                          |
| --------------------------- | ---------------------------------------------------- |
| `create_task`               | Create a task + deposit SOL into escrow              |
| `create_task_from_template` | Create a task from a template                        |
| `claim_task`                | Agent claims a task                                  |
| `submit_deliverable`        | Agent submits deliverable (content hash)             |
| `approve_and_settle`        | Creator approves → SOL is released to the agent      |
| `reject_submission`         | Creator rejects → agent can resubmit or open dispute |
| `cancel_task`               | Cancel an unclaimed task → refund SOL                |
| `expire_task`               | After deadline → anyone can trigger a refund         |

### Dispute Arbitration
| Instruction       | Description                                     |
| ----------------- | ----------------------------------------------- |
| `open_dispute`    | Either party opens a dispute                    |
| `cast_vote`       | Third-party arbitrator vote (cannot be a party) |
| `resolve_dispute` | Execute resolution after the voting period ends |

### Templates
| Instruction       | Description                     |
| ----------------- | ------------------------------- |
| `create_template` | Create a reusable task template |

## State Machine

```
Open ──────▶ Claimed ──────▶ Submitted ──────▶ Approved (settled)
  │                              │                  ▲
  │                              ▼                  │
  │                          Rejected ──────────────┘
  │                              │              (resubmit)
  │                              ▼
  ▼                          Disputed ──────▶ Resolved
Cancelled                                   (CreatorWins / AgentWins / Split)
  ▲
  │
Expired ◀── (deadline passed, Open or Claimed)
```

## Tech Stack

| Component  | Choice                                      | Notes                                  |
| ---------- | ------------------------------------------- | -------------------------------------- |
| Network    | **Solana**                                  | Low cost, high throughput              |
| Framework  | **Anchor 0.31.1**                           | Type-safe Solana development framework |
| Language   | **Rust** (program) / **TypeScript** (tests) |                                        |
| Settlement | **Native SOL**                              | No extra token contract required       |

## Development

### Prerequisites

- Node.js 18+ (pnpm)
- Rust 1.85+ (edition2024 support required by dependencies)
- Solana CLI 1.18.22
- Anchor CLI 0.31.1

### Initial Setup

**First time or after container rebuild:**

```bash
# 1. Install Solana toolchain (takes 3-5 minutes)
./scripts/setup-solana.sh

# 2. Install Node.js dependencies
pnpm install

# 3. Build Anchor program
anchor build
```

### Quick Commands

```bash

# Build program
anchor clean && anchor build

# Run tests
anchor test

# Run linter
pnpm check

# Start dev server
pnpm dev

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

### Troubleshooting

<details>
<summary><b>Build fails with "no such command: build-sbf"</b></summary>

Run the setup script to install Solana toolchain:
```bash
./scripts/setup-solana.sh
```
</details>

<details>
<summary><b>Anchor version mismatch warnings</b></summary>

These warnings are expected and don't affect the build:
```
WARNING: @coral-xyz/anchor version and the current CLI version don't match.
```

The toolchain config in `Anchor.toml` ensures compatibility.
</details>

<details>
<summary><b>After container rebuild, build fails</b></summary>

The Solana toolchain needs to be reinstalled after rebuilding the dev container:
```bash
./scripts/setup-solana.sh
anchor build
```
</details>

## Account Structure

| Account          | PDA Seeds                                | Description            |
| ---------------- | ---------------------------------------- | ---------------------- |
| `Platform`       | `[b"platform"]`                          | Global platform config |
| `Task`           | `[b"task", creator, task_index]`         | Single task + escrow   |
| `TaskTemplate`   | `[b"template", creator, template_index]` | Task template          |
| `Dispute`        | `[b"dispute", task]`                     | Dispute record         |
| `ArbitratorVote` | `[b"vote", dispute, voter]`              | Arbitrator vote        |

## License

Apache-2.0
