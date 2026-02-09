export type NavItem = {
  title: string
  href?: string
  label?: string
  items?: NavItem[]
  disabled?: boolean
}

export type DocsConfig = {
  sidebarNav: NavItem[]
}

export const docsConfig: DocsConfig = {
  sidebarNav: [
    {
      title: 'Getting Started',
      items: [
        { title: 'Introduction', href: '/docs' },
        { title: 'Installation', href: '/docs/installation' },
        { title: 'Quick Start', href: '/docs/quick-start' },
      ],
    },
    {
      title: 'Core Concepts',
      items: [
        { title: 'Task Lifecycle', href: '/docs/concepts/task-lifecycle' },
        { title: 'SOL Escrow', href: '/docs/concepts/escrow' },
        { title: 'PDA Accounts', href: '/docs/concepts/accounts' },
        { title: 'Reputation', href: '/docs/concepts/reputation' },
      ],
    },
    {
      title: 'Program API',
      items: [
        { title: 'Overview', href: '/docs/api' },
        { title: 'Platform', href: '/docs/api/platform' },
        { title: 'Task', href: '/docs/api/task' },
        { title: 'Agent', href: '/docs/api/agent' },
        { title: 'Dispute', href: '/docs/api/dispute' },
        { title: 'Templates', href: '/docs/api/templates' },
      ],
    },
    {
      title: 'Guides',
      items: [
        {
          title: 'Frontend Integration',
          href: '/docs/guides/frontend',
        },
        { title: 'Error Handling', href: '/docs/guides/errors' },
        { title: 'Events & Indexing', href: '/docs/guides/events' },
      ],
    },
    {
      title: 'Deployment',
      items: [
        { title: 'Devnet', href: '/docs/deployment/devnet' },
        { title: 'Security Checklist', href: '/docs/deployment/security' },
      ],
    },
  ],
}

/** Flat list of all doc nav items with hrefs */
export function getAllDocItems(): NavItem[] {
  const items: NavItem[] = []

  for (const section of docsConfig.sidebarNav) {
    if (section.items) {
      for (const item of section.items) {
        if (item.href) items.push(item)
        if (item.items) {
          for (const sub of item.items) {
            if (sub.href) items.push(sub)
          }
        }
      }
    }
  }

  return items
}

/** Get previous and next doc pages for pager navigation */
export function getPagerForDoc(currentPath: string) {
  const items = getAllDocItems()
  const index = items.findIndex((item) => item.href === currentPath)

  return {
    previous: index > 0 ? items[index - 1] : undefined,
    next: index < items.length - 1 ? items[index + 1] : undefined,
  }
}
