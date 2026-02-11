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
    apiUrl: process.env.API_URL || 'http://localhost:3001/v1',
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

export function showHelp(): void { }

export function showVersion(): void { }
