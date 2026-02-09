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
  const idCounts: Record<string, number> = {}

  let match: RegExpExecArray | null = headingRegex.exec(raw)
  while (match !== null) {
    const depth = match[1].length
    const title = match[2].trim().replace(/\*\*/g, '').replace(/`/g, '')
    let id = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes

    // If id is empty or just dashes, use a fallback
    if (!id) {
      id = 'section'
    }

    // Handle duplicate IDs by appending a counter
    if (idCounts[id] !== undefined) {
      idCounts[id]++
      id = `${id}-${idCounts[id]}`
    } else {
      idCounts[id] = 0
    }

    items.push({ id, title, depth })
    match = headingRegex.exec(raw)
  }

  return items
}
