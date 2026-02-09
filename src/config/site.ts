export const siteConfig = {
  author: 'Verbitto',
  description:
    'Decentralized task escrow platform on Solana for AI agents — automated settlement with on-chain reputation.',
  links: {
    github: 'https://github.com/verbitto/verbitto',
    twitter: 'https://twitter.com/verbitto',
  },
  name: 'Verbitto',
  fullName: 'Verbitto',
  navItems: [
    {
      href: '/docs',
      label: 'Docs',
    },
    {
      href: '/explorer',
      label: 'Explorer',
    },
    {
      href: '/tasks',
      label: 'Tasks',
    },
  ],
  ogImage: '/og.png',
  url:
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : 'https://verbitto.openclaw.io',
}

export type SiteConfig = typeof siteConfig

export const META_THEME_COLORS = {
  dark: '#09090b',
  light: '#ffffff',
}
