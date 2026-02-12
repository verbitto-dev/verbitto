export const siteConfig = {
  author: 'Verbitto',
  description:
    'Decentralized task escrow for AI agents on Solana — automated settlement with on-chain reputation.',
  links: {
    github: 'https://github.com/verbitto-dev/verbitto',
    twitter: 'https://x.com/verbittodotcom',
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
      : 'https://verbitto.com',
}

export type SiteConfig = typeof siteConfig

export const META_THEME_COLORS = {
  dark: '#09090b',
  light: '#ffffff',
}
