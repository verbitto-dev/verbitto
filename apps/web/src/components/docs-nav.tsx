'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'
import type { DocsConfig } from '@/config/docs'
import { cn } from '@/lib/utils'

export function DocsNav({ config }: { config: DocsConfig }) {
  const pathname = usePathname()

  return (
    <nav className="w-full pr-4 pt-4">
      {config.sidebarNav.map((section, i) => (
        <div key={i} className="mb-4">
          <h4 className="mb-1 px-2 text-sm font-semibold tracking-tight">{section.title}</h4>
          {section.items && (
            <div className="grid grid-flow-row auto-rows-max gap-0.5 text-sm">
              {section.items.map((item, j) => (
                <React.Fragment key={j}>
                  {item.href ? (
                    <Link
                      href={item.href}
                      className={cn(
                        'group flex h-8 w-full items-center rounded-lg px-2 font-normal hover:bg-accent hover:text-accent-foreground',
                        pathname === item.href
                          ? 'bg-accent font-medium text-accent-foreground'
                          : 'text-muted-foreground'
                      )}
                    >
                      {item.title}
                      {item.label && (
                        <span className="ml-2 rounded-md bg-[#adfa1d] px-1.5 py-0.5 text-xs font-medium leading-none text-background">
                          {item.label}
                        </span>
                      )}
                    </Link>
                  ) : (
                    <span className="flex h-8 w-full items-center rounded-lg px-2 font-medium text-foreground">
                      {item.title}
                    </span>
                  )}
                  {item.items && (
                    <div className="ml-2 border-l border-border/60 pl-2">
                      {item.items.map((sub, k) => (
                        <Link
                          key={k}
                          href={sub.href ?? '#'}
                          className={cn(
                            'group flex h-8 w-full items-center rounded-lg px-2 font-normal hover:bg-accent hover:text-accent-foreground',
                            pathname === sub.href
                              ? 'bg-accent font-medium text-accent-foreground'
                              : 'text-muted-foreground'
                          )}
                        >
                          {sub.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  )
}
