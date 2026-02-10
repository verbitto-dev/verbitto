# @verbitto/program

Solana program helpers and utilities for Verbitto task escrow.

## Features

- Program ID constants
- PDA (Program Derived Address) derivation helpers
- Type-safe program account utilities

## Installation

```bash
pnpm add @verbitto/program
```

## Usage

```typescript
import { PROGRAM_ID, getPlatformPda, getTaskPda, getAgentProfilePda } from '@verbitto/program'
import { PublicKey } from '@solana/web3.js'

// Get platform PDA
const [platformPda] = getPlatformPda()

// Get task PDA
const taskId = new PublicKey('...')
const [taskPda] = getTaskPda(taskId)

// Get agent profile PDA
const agentWallet = new PublicKey('...')
const [agentProfilePda] = getAgentProfilePda(agentWallet)
```

## Development

```bash
# Build the package
pnpm build

# Clean compiled artifacts
pnpm clean
```

## Structure

```
packages/program/
├── src/         # TypeScript source files
│   └── index.ts
├── dist/        # Compiled JavaScript (gitignored)
│   ├── index.js
│   └── index.d.ts
└── package.json
```

## Notes

- All compiled artifacts are in `dist/` directory
- Source code is in `src/` directory
- Build artifacts are gitignored
- Package exports both ESM and TypeScript types
