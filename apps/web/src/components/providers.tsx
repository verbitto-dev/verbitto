'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type React from 'react'

import { SolanaProvider } from './solana-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      disableTransitionOnChange
      enableColorScheme
      enableSystem
    >
      <SolanaProvider>{children}</SolanaProvider>
    </NextThemesProvider>
  )
}
