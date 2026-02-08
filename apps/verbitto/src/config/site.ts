export const siteConfig = {
    author: 'Verbitto',
    description:
        'Trustless task settlement platform — Agents complete tasks, settle on-chain, reputation on record.',
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
};

export type SiteConfig = typeof siteConfig;

export const META_THEME_COLORS = {
    dark: '#09090b',
    light: '#ffffff',
};
