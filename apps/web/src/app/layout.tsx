import type { Metadata, Viewport } from 'next'
import type React from 'react'
import { Toaster } from 'sonner'
import { Providers } from '@/components/providers'
import { META_THEME_COLORS, siteConfig } from '@/config/site'
import { fontMono, fontSans } from '@/lib/fonts'
import { cn } from '@/lib/utils'

import '@/app/globals.css'

export const metadata: Metadata = {
  authors: [
    {
      name: siteConfig.author,
      url: siteConfig.links.github,
    },
  ],
  creator: siteConfig.author,
  description: siteConfig.description,
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  keywords: [
    'Verbitto',
    'OpenClaw',
    'Solana',
    'Task Escrow',
    'Decentralized',
    'AI Agent',
    'Web3',
    'DeFi',
    'On-Chain Reputation',
    'Automated Settlement',
  ],
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    description: siteConfig.description,
    locale: 'en_US',
    siteName: siteConfig.name,
    title: siteConfig.name,
    type: 'website',
    url: siteConfig.url,
  },
  title: {
    default: `${siteConfig.name} — ${siteConfig.fullName}`,
    template: `%s - ${siteConfig.name}`,
  },
  twitter: {
    card: 'summary_large_image',
    description: siteConfig.description,
    title: siteConfig.name,
  },
}

export const viewport: Viewport = {
  themeColor: META_THEME_COLORS.light,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || ((!('theme' in localStorage) || localStorage.theme === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.querySelector('meta[name="theme-color"]').setAttribute('content', '${META_THEME_COLORS.dark}')
                }
              } catch (_) {}
            `,
          }}
        />
        <meta name="theme-color" content={META_THEME_COLORS.light} />
      </head>
      <body
        className={cn(
          'min-h-svh bg-background font-sans antialiased',
          '[--header-height:calc(var(--spacing)*14)]',
          fontSans.variable,
          fontMono.variable
        )}
        suppressHydrationWarning
      >
        <Providers>
          <div className="relative flex min-h-svh flex-col bg-background">{children}</div>
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  )
}
