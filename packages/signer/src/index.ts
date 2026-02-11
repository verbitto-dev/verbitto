#!/usr/bin/env node
import { type Keypair, Transaction } from '@solana/web3.js'
import express from 'express'
import { authMiddleware, isApiKeyEnabled } from './auth.js'
import { parseArgs, showHelp, showVersion } from './cli.js'
import { fetchWithRetry } from './fetch.js'
import { ALLOWED_PROGRAM_ID, validateTransaction } from './security.js'
import { loadWallet } from './wallet.js'

// ============================================================================
// CLI
// ============================================================================

const CLI_OPTIONS = parseArgs()

if (CLI_OPTIONS.help) {
  showHelp()
  process.exit(0)
}

if (CLI_OPTIONS.version) {
  showVersion()
  process.exit(0)
}

// ============================================================================
// App Setup
// ============================================================================

const app = express()
app.use(express.json())

const API_BASE = CLI_OPTIONS.apiUrl
const PORT = CLI_OPTIONS.port
const keypair: Keypair = loadWallet(CLI_OPTIONS)

// Apply auth to all /verbitto routes
app.use('/verbitto', authMiddleware)

// ============================================================================
// Routes
// ============================================================================

interface ExecuteRequestBody {
  action?: string
  params?: Record<string, unknown>
}

interface BuildTxResponse {
  transaction: string
}

/**
 * POST /verbitto/execute
 * Execute a Verbitto action (build + sign + send transaction)
 */
app.post('/verbitto/execute', async (req, res) => {
  const { action, params = {} } = req.body as ExecuteRequestBody

  if (!action) {
    res.status(400).json({ error: 'Missing required field: action' })
    return
  }

  try {
    console.log(`[${new Date().toISOString()}] Executing action: ${action}`)
    console.log('  Params:', JSON.stringify(params, null, 2))

    // Step 1: Build unsigned transaction via API
    const buildRes = await fetchWithRetry(`${API_BASE}/tx/build`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instruction: action,
        signer: keypair.publicKey.toBase58(),
        params,
      }),
    })

    if (!buildRes.ok) {
      const error = (await buildRes.json()) as { error?: string }
      console.error('  ❌ Build transaction failed:', error)
      res.status(buildRes.status).json({ error: error.error || 'Failed to build transaction' })
      return
    }

    const { transaction } = (await buildRes.json()) as BuildTxResponse

    // Step 2: Validate transaction (whitelist check)
    const tx = Transaction.from(Buffer.from(transaction, 'base64'))
    const validation = validateTransaction(tx)
    if (!validation.valid) {
      console.error(`  🛡️ Transaction REJECTED: ${validation.reason}`)
      res.status(403).json({
        error: 'Transaction validation failed',
        reason: validation.reason,
      })
      return
    }

    // Step 3: Sign transaction locally
    tx.sign(keypair)

    // Step 4: Send signed transaction
    const sendRes = await fetchWithRetry(`${API_BASE}/tx/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signedTransaction: tx.serialize().toString('base64'),
      }),
    })

    if (!sendRes.ok) {
      const error = (await sendRes.json()) as { error?: string }
      console.error('  ❌ Send transaction failed:', error)
      res.status(sendRes.status).json({ error: error.error || 'Failed to send transaction' })
      return
    }

    const result = (await sendRes.json()) as { signature: string }
    console.log(`  ✅ Transaction successful: ${result.signature}`)

    res.json({
      success: true,
      signature: result.signature,
      explorer: `https://explorer.solana.com/tx/${result.signature}?cluster=devnet`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('  ❌ Execution failed:', err)
    res.status(500).json({
      error: message,
      detail: 'Internal signer service error',
    })
  }
})

/**
 * GET /verbitto/*
 * Proxy read-only queries to Verbitto API (no signing required)
 */
app.get('/verbitto/*', async (req, res) => {
  const endpoint = (req.params as Record<string, string>)[0]

  // Sanitize path to prevent directory traversal attacks
  const sanitized = endpoint.replace(/\.\./g, '').replace(/\/\//g, '/')
  if (sanitized !== endpoint || endpoint.includes('\0')) {
    res.status(400).json({ error: 'Invalid endpoint path' })
    return
  }

  const queryString = new URLSearchParams(req.query as Record<string, string>).toString()
  const url = `${API_BASE}/${sanitized}${queryString ? '?' + queryString : ''}`

  try {
    const response = await fetchWithRetry(url)
    const data = await response.json()
    res.status(response.status).json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    wallet: keypair.publicKey.toBase58(),
    api: API_BASE,
    security: {
      apiKeyEnabled: isApiKeyEnabled(),
      programWhitelist: ALLOWED_PROGRAM_ID.toBase58(),
    },
  })
})

// ============================================================================
// Start
// ============================================================================

app.listen(PORT, () => {
  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🦞 Verbitto Transaction Signer')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`📡 Address: http://localhost:${PORT}`)
  console.log(`🔑 Wallet: ${keypair.publicKey.toBase58()}`)
  console.log(`🛡️ Program whitelist: ${ALLOWED_PROGRAM_ID.toBase58()}`)
  console.log(
    `🔐 API key auth: ${isApiKeyEnabled() ? 'ENABLED' : 'DISABLED (set SIGNER_API_KEY to enable)'}`
  )
  console.log('')
  console.log('Available endpoints:')
  console.log('')
  console.log('  # Register agent')
  console.log(`  curl -X POST http://localhost:${PORT}/verbitto/execute \\`)
  console.log('    -H "Content-Type: application/json" \\')
  console.log('    -d \'{"action":"registerAgent","params":{"skillTags":6}}\'')
  console.log('')
  console.log('  # Query tasks')
  console.log(`  curl http://localhost:${PORT}/verbitto/tasks?status=Open`)
  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
})

process.on('SIGINT', () => {
  console.log('\n👋 Signer service stopped')
  process.exit(0)
})
