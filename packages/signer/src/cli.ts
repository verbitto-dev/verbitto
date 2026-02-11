import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const PACKAGE_JSON = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'))
export const PACKAGE_VERSION: string = PACKAGE_JSON.version

export interface CLIOptions {
  port: number
  apiUrl: string
  wallet: string | null
  help: boolean
  version: boolean
}

export function parseArgs(): CLIOptions {
  const args = process.argv.slice(2)
  const options: CLIOptions = {
    port: parseInt(process.env.PORT || '3344', 10),
    apiUrl: process.env.API_URL || 'http://localhost:3001/api/v1',
    wallet: process.env.WALLET_PATH || null,
    help: false,
    version: false,
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    switch (arg) {
      case '-p':
      case '--port':
        options.port = parseInt(args[++i], 10)
        break
      case '-a':
      case '--api':
      case '--api-url':
        options.apiUrl = args[++i]
        break
      case '-w':
      case '--wallet':
        options.wallet = args[++i]
        break
      case '-h':
      case '--help':
        options.help = true
        break
      case '-v':
      case '--version':
        options.version = true
        break
      default:
        if (arg.startsWith('-')) {
          console.error(`Unknown option: ${arg}`)
          console.error('Use --help to see available options')
          process.exit(1)
        }
    }
  }

  return options
}

export function showHelp(): void {
  console.log(`
Verbitto Transaction Signer v${PACKAGE_VERSION}

A local signing proxy for Verbitto platform that enables autonomous agents
to execute on-chain transactions without exposing private keys.

USAGE:
  verbitto-signer [OPTIONS]

OPTIONS:
  -p, --port <PORT>       HTTP server port (default: 3344, env: PORT)
  -a, --api-url <URL>     Verbitto API base URL (default: http://localhost:3001/api/v1, env: API_URL)
  -w, --wallet <PATH>     Path to wallet keypair JSON file (env: WALLET_PATH)
  -h, --help              Show this help message
  -v, --version           Show version number

EXAMPLES:
  # Start with default settings
  verbitto-signer

  # Start on custom port with specific wallet
  verbitto-signer --port 8080 --wallet ./my-wallet.json

  # Connect to production API
  verbitto-signer --api-url https://api.verbitto.io/api/v1

  # Using environment variables
  PORT=8080 API_URL=https://api.verbitto.io/api/v1 verbitto-signer

WALLET SEARCH PATHS (in order):
  1. Path specified via --wallet or WALLET_PATH
  2. ~/.config/solana/id.json (Solana CLI default)
  3. ./wallet.json (current directory)

SECURITY:
  SIGNER_API_KEY     Set to require Bearer token auth on all requests
  PROGRAM_ID         Override the allowed Verbitto program ID
                     (default: Coxgjx4UMQZPRdDZT9CAdrvt4TMTyUKH79ziJiNFHk8S)

ENDPOINTS:
  POST /verbitto/execute   Execute a signed transaction
  GET  /verbitto/*         Proxy read-only queries to API
  GET  /health             Health check

For more information, visit: https://github.com/verbitto-dev/signer
`)
}

export function showVersion(): void {
  console.log(`verbitto-signer v${PACKAGE_VERSION}`)
}
