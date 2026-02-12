import { createHash } from 'node:crypto'
import * as anchor from '@coral-xyz/anchor'
import { AnchorProvider, type Program } from '@coral-xyz/anchor'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import type { TaskEscrow } from '../target/types/task_escrow.js'

// Helper: SHA-256 hash a string into a 32-byte array
function hashDescription(text: string): number[] {
  const digest = createHash('sha256').update(text).digest()
  return Array.from(digest)
}

// TaskCategory enum values matching the on-chain IDL
const TaskCategory = {
  DataLabeling: { dataLabeling: {} },
  LiteratureReview: { literatureReview: {} },
  CodeReview: { codeReview: {} },
  Translation: { translation: {} },
  Analysis: { analysis: {} },
  Research: { research: {} },
  Other: { other: {} },
} as const

// ── Base task templates ──────────────────────────────────────
const TEMPLATES = [
  {
    title: 'Data Labeling',
    description:
      'Label, annotate, or classify datasets according to provided guidelines. Deliverables include the labeled dataset and a brief quality report.',
    defaultBounty: 0.05 * LAMPORTS_PER_SOL,
    category: TaskCategory.DataLabeling,
  },
  {
    title: 'Literature Review',
    description:
      'Conduct a structured literature review on a specified topic. Deliverables include a summary document with key findings and a bibliography.',
    defaultBounty: 0.1 * LAMPORTS_PER_SOL,
    category: TaskCategory.LiteratureReview,
  },
  {
    title: 'Code Review',
    description:
      'Review source code for bugs, security vulnerabilities, and best-practice adherence. Deliverables include a detailed review report with actionable recommendations.',
    defaultBounty: 0.08 * LAMPORTS_PER_SOL,
    category: TaskCategory.CodeReview,
  },
  {
    title: 'Translation',
    description:
      'Translate documents or content between specified languages while preserving meaning and tone. Deliverables include the translated document and a translation notes file.',
    defaultBounty: 0.06 * LAMPORTS_PER_SOL,
    category: TaskCategory.Translation,
  },
  {
    title: 'Data Analysis',
    description:
      'Analyze a provided dataset and produce insights, charts, and a summary report. Deliverables include the analysis notebook/script and a presentation-ready report.',
    defaultBounty: 0.1 * LAMPORTS_PER_SOL,
    category: TaskCategory.Analysis,
  },
  {
    title: 'Research Report',
    description:
      'Investigate a specified topic and produce a comprehensive research report. Deliverables include the full report, executive summary, and supporting references.',
    defaultBounty: 0.15 * LAMPORTS_PER_SOL,
    category: TaskCategory.Research,
  },
  {
    title: 'General Task',
    description:
      'A flexible task template for miscellaneous work. The creator should specify exact deliverables and acceptance criteria in the task description.',
    defaultBounty: 0.05 * LAMPORTS_PER_SOL,
    category: TaskCategory.Other,
  },
]

async function main() {
  const provider = AnchorProvider.env()
  anchor.setProvider(provider)

  const program = anchor.workspace.TaskEscrow as Program<TaskEscrow>

  console.log('🚀 Initializing base task templates...')
  console.log('Program ID:', program.programId.toString())
  console.log('Creator:', provider.wallet.publicKey.toString())

  // Derive Platform PDA to read current template_count
  const [platformPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('platform')],
    program.programId
  )

  const platformBefore = await program.account.platform.fetch(platformPda)
  console.log('Current template count:', platformBefore.templateCount.toString())

  let created = 0
  for (const tpl of TEMPLATES) {
    const descHash = hashDescription(tpl.description)

    console.log(`\n📝 Creating template: "${tpl.title}"`)
    console.log(`   Default bounty: ${tpl.defaultBounty / LAMPORTS_PER_SOL} SOL`)

    try {
      const tx = await program.methods
        .createTemplate(tpl.title, descHash, new BN(tpl.defaultBounty), tpl.category as any)
        .accounts({
          creator: provider.wallet.publicKey,
        })
        .rpc()

      console.log(`   ✅ TX: ${tx}`)
      created++
    } catch (err: any) {
      // If the template PDA already exists, skip gracefully
      if (err?.message?.includes('already in use')) {
        console.log('   ⚠️  Template PDA already exists, skipping.')
      } else {
        console.error('   ❌ Failed:', err?.message ?? err)
        throw err
      }
    }
  }

  // Summary
  const platformAfter = await program.account.platform.fetch(platformPda)
  console.log('\n────────────────────────────────')
  console.log(`✅ Created ${created} / ${TEMPLATES.length} templates`)
  console.log(`Total templates on-chain: ${platformAfter.templateCount.toString()}`)
}

main()
  .then(() => {
    console.log('\n🎉 Done!')
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
