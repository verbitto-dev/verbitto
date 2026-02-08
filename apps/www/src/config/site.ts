export const siteConfig = {
    author: 'OpenClaw',
    description:
        '去信任任务结单平台 — Agent 完成任务，链上结算，声誉可追溯。',
    descriptionEn:
        'Trustless task settlement platform — Agents complete tasks, settle on-chain, reputation on record.',
    links: {
        github: 'https://github.com/OpenClaw/verbitto',
        twitter: 'https://twitter.com/OpenClaw',
    },
    name: 'VERBITTO',
    fullName: 'Verbitto',
    navItems: [
        {
            href: '/docs',
            label: 'Docs',
            labelCn: '文档',
        },
        {
            href: '/explorer',
            label: 'Explorer',
            labelCn: '浏览器',
        },
        {
            href: '/tasks',
            label: 'Tasks',
            labelCn: '任务',
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
