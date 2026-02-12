'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { siteConfig } from '@/config/site'
import { cn } from '@/lib/utils'

import { Icons } from './icons'

export function Logo() {
  return (
    <Link href="/" className="hidden items-center gap-2 font-bold md:flex px-2">
      <Icons.logo className="h-7 w-7 shrink-0" />
      <span className="text-lg">{siteConfig.name}</span>
    </Link>
  )
}

export function MainNav({ className }: { className?: string }) {
  const pathname = usePathname()

  return (
    <nav className={cn('items-center gap-0.5', className)}>
      {siteConfig.navItems.map((item) => (
        <Button key={item.href} asChild size="default" variant="ghost">
          <Link className={cn(pathname === item.href && 'text-primary')} href={item.href}>
            {item.label}
          </Link>
        </Button>
      ))}
    </nav>
  )
}
