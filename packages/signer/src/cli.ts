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
  daemon: boolean
  daemonChild: boolean
  start: boolean
  stop: boolean
  restart: boolean
  status: boolean
}

export function parseArgs(): CLIOptions {
  const args = process.argv.slice(2)
  const options: CLIOptions = {
    port: parseInt(process.env.PORT || '3344', 10),
    apiUrl: process.env.API_URL || 'http://api.verbitto.com/v1',
    wallet: process.env.WALLET_PATH || null,
    help: false,
    version: false,
    daemon: false,
    daemonChild: false,
    start: false,
    stop: false,
    restart: false,
    status: false,
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
      case '-d':
      case '--daemon':
        options.daemon = true
        break
      case '--daemon-child':
        options.daemonChild = true
        break
      case 'start':
        options.start = true
        break
      case 'stop':
        options.stop = true
        break
      case 'restart':
        options.restart = true
        break
      case 'status':
        options.status = true
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
  console.info(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Verbitto Signer - AI Agent Transaction Signing Service
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

USAGE:
  verbitto-signer [command] [options]

COMMANDS:
  start              Start daemon in background
  stop               Stop running daemon
  restart            Restart daemon
  status             Show daemon status

OPTIONS:
  -p, --port <port>        Port to listen on (default: 3344)
  -a, --api-url <url>      Verbitto API URL (default: http://localhost:3001/v1)
  -w, --wallet <path>      Path to wallet keypair file
  -d, --daemon             Run as daemon (background)
  -h, --help               Show this help message
  -v, --version            Show version

ENVIRONMENT VARIABLES:
  PORT                     Server port (default: 3344)
  API_URL                  Verbitto API base URL
  WALLET_PATH              Path to wallet keypair JSON file
  API_KEY                  API key for authentication (optional)

EXAMPLES:
  # Start daemon in background
  verbitto-signer start

  # Start with custom port
  verbitto-signer start --port 8080

  # Stop daemon
  verbitto-signer stop

  # Check status
  verbitto-signer status

  # Run in foreground (for development)
  verbitto-signer --port 3344

For more information, visit: https://github.com/verbitto-dev/verbitto
`)
}

export function showVersion(): void {
  console.info(`verbitto-signer v${PACKAGE_VERSION}`)
}
