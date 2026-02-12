import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Idl } from '@coral-xyz/anchor'

let cachedIdl: Idl | null = null

/**
 * Load IDL from local file (with caching).
 * Searches multiple possible paths relative to cwd.
 */
export function loadIdl(): Idl {
  if (cachedIdl) return cachedIdl

  const possiblePaths = [
    join(process.cwd(), 'task_escrow.json'), // API directory (committed to git)
    join(process.cwd(), '../../target/idl/task_escrow.json'), // Monorepo build output
    join(process.cwd(), 'target/idl/task_escrow.json'), // Local build output
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
