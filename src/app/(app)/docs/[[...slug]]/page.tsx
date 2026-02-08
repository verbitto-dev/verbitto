import { allDocs } from 'contentlayer/generated'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DocContent } from '@/components/doc-content'
import { Mdx } from '@/components/mdx-components'
import { getTableOfContents } from '@/lib/toc'

type DocPageProps = {
  params: Promise<{ slug?: string[] }>
}

function getDocFromSlug(slug: string[] | undefined) {
  const path = slug?.join('/') ?? ''
  // Try exact match first, then try with /index suffix for directory index pages
  return (
    allDocs.find((doc) => doc.slugAsParams === path) ??
    allDocs.find((doc) => doc.slugAsParams === `${path}/index`) ??
    null
  )
}

export async function generateStaticParams() {
  return allDocs.map((doc) => {
    const slug = doc.slugAsParams
    if (slug === '') return { slug: [] }
    // Strip trailing /index for directory index pages
    const clean = slug.endsWith('/index') ? slug.slice(0, -'/index'.length) : slug
    return { slug: clean.split('/') }
  })
}

export async function generateMetadata({ params }: DocPageProps): Promise<Metadata> {
  const { slug } = await params
  const doc = getDocFromSlug(slug)
  if (!doc) return {}

  return {
    title: `${doc.title} — Verbitto Docs`,
    description: doc.description,
  }
}

export default async function DocPage({ params }: DocPageProps) {
  const { slug } = await params
  const doc = getDocFromSlug(slug)

  if (!doc) notFound()

  const toc = doc.toc !== false ? getTableOfContents(doc.body.raw) : []

  return (
    <DocContent title={doc.title} description={doc.description} toc={toc}>
      <Mdx code={doc.body.code} />
    </DocContent>
  )
}
