import React from 'react';

import type { Metadata, Viewport } from 'next';

import { Providers } from '@/components/providers';
import { META_THEME_COLORS, siteConfig } from '@/config/site';
import { fontMono, fontSans } from '@/lib/fonts';
import { cn } from '@/lib/utils';

import '@/app/globals.css';

export const metadata: Metadata = {
  authors: [
    {
      name: siteConfig.author,
      url: siteConfig.links.github,
    },
  ],
  creator: siteConfig.author,
  description: siteConfig.descriptionEn,
  icons: {
    icon: '/favicon.svg',
  },
  keywords: [
    'VERBITTO',
    'OpenClaw',
    'Solana',
    'Task Escrow',
    'Agent',
    'Web3',
    'DeFi',
    'Trustless Settlement',
  ],
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    description: siteConfig.descriptionEn,
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
    description: siteConfig.descriptionEn,
    title: siteConfig.name,
  },
};

export const viewport: Viewport = {
  themeColor: META_THEME_COLORS.light,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
          fontSans.variable,
          fontMono.variable
        )}
        suppressHydrationWarning
      >
        <Providers>
          <div className="relative flex min-h-svh flex-col bg-background">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
