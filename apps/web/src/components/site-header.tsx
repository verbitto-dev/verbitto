'use client'

import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

import { Logo, MainNav } from './main-nav'
import { MobileNav } from './mobile-nav'
import { WalletButton } from './wallet-button'

export function SiteHeader() {
  const pathname = usePathname()
  const isHome = pathname === '/'

  return (
    <header
      className={
        isHome
          ? 'sticky top-0 z-50 w-full bg-transparent text-white'
          : 'sticky top-0 z-50 w-full bg-background border-border/40 border-b'
      }
    >
      <div className="mx-auto max-w-screen-2xl">
        <div className="flex h-(--header-height) items-center gap-2 px-4 xl:px-6">
          {/* Mobile */}
          <MobileNav className="flex md:hidden" />

          {/* Desktop */}
          <Logo />
          <MainNav className="hidden md:flex" />

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2 md:flex-1 md:justify-end">
            <span
              className={cn(
                'rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                isHome
                  ? 'border-yellow-300/60 bg-yellow-400/20 text-yellow-100'
                  : 'border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:border-yellow-400/30 dark:bg-yellow-400/10 dark:text-yellow-400'
              )}
            >
              Devnet
            </span>
            <WalletButton />
          </div>
        </div>
      </div>
    </header>
  )
}
