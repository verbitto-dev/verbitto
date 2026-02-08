import Link from 'next/link';

import { ModeSwitcher } from '@/components/mode-switcher';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/config/site';

import { Icons } from './icons';
import { Logo, MainNav } from './main-nav';
import { MobileNav } from './mobile-nav';
import { WalletButton } from './wallet-button';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
      <div className="container mx-auto px-6">
        <div className="flex h-14 items-center gap-2">
          {/* Mobile */}
          <MobileNav className="flex md:hidden" />

          {/* Desktop */}
          <Logo />
          <MainNav className="hidden md:flex" />

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2">
            <Button size="icon" variant="ghost" className="size-8">
              <Link
                href={siteConfig.links.github}
                rel="noreferrer"
                target="_blank"
              >
                <Icons.gitHub className="size-4" />
                <span className="sr-only">GitHub</span>
              </Link>
            </Button>

            <ModeSwitcher />
            <WalletButton />
          </div>
        </div>
      </div>
    </header>
  );
}
