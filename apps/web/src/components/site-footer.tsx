import Link from 'next/link'

import { Icons } from '@/components/icons'
import { ModeSwitcher } from '@/components/mode-switcher'
import { siteConfig } from '@/config/site'

export function SiteFooter() {
  return (
    <footer className="border-border/40 border-t py-6 dark:border-border">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-4 xl:px-6">
        <div className="flex items-center justify-between px-4 xl:px-6 gap-6">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} {siteConfig.author}. All rights reserved.
          </p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/terms" className="transition-colors hover:text-foreground">
              Terms
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-foreground">
              Privacy
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href={siteConfig.links.twitter}
            rel="noreferrer"
            target="_blank"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <Icons.x className="size-4" />
            <span className="sr-only">X</span>
          </Link>
          <Link
            href={siteConfig.links.github}
            rel="noreferrer"
            target="_blank"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <Icons.gitHub className="size-4" />
            <span className="sr-only">GitHub</span>
          </Link>
          <ModeSwitcher />
        </div>
      </div>
    </footer>
  )
}
