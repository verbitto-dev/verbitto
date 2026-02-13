import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Idl } from '@coral-xyz/anchor'

let cachedIdl: Idl | null = null

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Load IDL from local file (with caching).
 * Searches multiple possible paths relative to cwd.
 */
export function loadIdl(): Idl {
  if (cachedIdl) return cachedIdl

  const possiblePaths = [
    join(__dirname, '../../task_escrow.json'),
    join(process.cwd(), 'task_escrow.json'),
    join(process.cwd(), 'apps/api/task_escrow.json'),
    join(process.cwd(), '../../target/idl/task_escrow.json'),
    join(process.cwd(), 'target/idl/task_escrow.json'),
  ]

  for (const idlPath of possiblePaths) {
    try {
      const idlData = readFileSync(idlPath, 'utf-8')
      cachedIdl = JSON.parse(idlData) as Idl
      return cachedIdl
    } catch { }
  }

  throw new Error("IDL file not found. Run 'anchor build' first.")
}
