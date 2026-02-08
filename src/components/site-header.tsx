import { Logo, MainNav } from './main-nav'
import { MobileNav } from './mobile-nav'
import { WalletButton } from './wallet-button'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full bg-background border-border/40 border-b">
      <div className="mx-auto max-w-screen-2xl">
        <div className="flex h-(--header-height) items-center gap-2 px-4 xl:px-6">
          {/* Mobile */}
          <MobileNav className="flex md:hidden" />

          {/* Desktop */}
          <Logo />
          <MainNav className="hidden md:flex" />

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2 md:flex-1 md:justify-end">
            <WalletButton />
          </div>
        </div>
      </div>
    </header>
  )
}
