'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { siteConfig } from '@/config/site'
import { cn } from '@/lib/utils'

export function MobileNav({ className }: { className?: string }) {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const isHome = pathname === '/'

  return (
    <div className={className}>
      <Button variant="ghost" className="size-8 p-0" onClick={() => setOpen(!open)}>
        <div className="relative size-4">
          <span
            className={cn(
              'absolute left-0 block h-0.5 w-4 transition-all duration-100',
              isHome ? 'bg-white' : 'bg-foreground',
              open ? '-rotate-45 top-[0.4rem]' : 'top-1'
            )}
          />
          <span
            className={cn(
              'absolute left-0 block h-0.5 w-4 transition-all duration-100',
              isHome ? 'bg-white' : 'bg-foreground',
              open ? 'top-[0.4rem] rotate-45' : 'top-2.5'
            )}
          />
        </div>
        <span className="sr-only">Toggle menu</span>
      </Button>

      {open && (
        <div
          className={cn(
            'fixed inset-x-0 top-14 z-50 backdrop-blur p-6',
            isHome ? 'bg-gray-900/95' : 'bg-background/95'
          )}
        >
          <div className="flex flex-col gap-4">
            {siteConfig.navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn('text-xl font-medium', isHome ? 'text-white' : 'text-foreground')}
                onClick={() => {
                  setOpen(false)
                  router.push(item.href)
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
