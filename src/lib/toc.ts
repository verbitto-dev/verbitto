export interface TocItem {
  id: string
  title: string
  depth: number
}

/**
 * Extract headings from raw markdown/MDX body text.
 * Returns an array of {id, title, depth} for h2/h3/h4.
 */
export function getTableOfContents(raw: string): TocItem[] {
  const headingRegex = /^(#{2,4})\s+(.+)$/gm
  const items: TocItem[] = []

  let match: RegExpExecArray | null = headingRegex.exec(raw)
  while (match !== null) {
    const depth = match[1].length
    const title = match[2].trim().replace(/\*\*/g, '').replace(/`/g, '')
    const id = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')

    items.push({ id, title, depth })
    match = headingRegex.exec(raw)
  }

  return items
}
