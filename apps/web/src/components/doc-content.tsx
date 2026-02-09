'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type React from 'react'
import { DocsTableOfContents } from '@/components/docs-toc'
import { Icons } from '@/components/icons'
import { getPagerForDoc } from '@/config/docs'
import { cn } from '@/lib/utils'

type TocItem = {
  id: string
  title: string
  depth: number
}

interface DocContentProps {
  title: string
  description?: string
  toc?: TocItem[]
  children: React.ReactNode
}

export function DocContent({ title, description, toc, children }: DocContentProps) {
  const pathname = usePathname()
  const { previous, next } = getPagerForDoc(pathname)

  return (
    <div className="relative flex items-stretch lg:w-full">
      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div
          className={cn(
            'mx-auto flex w-full min-w-0 flex-1 flex-col gap-8 px-4 py-6 text-foreground/90 lg:px-0 lg:py-8'
          )}
        >
          {/* Header */}
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between">
              <h1 className="scroll-m-20 text-3xl font-semibold tracking-tight lg:text-4xl">
                {title}
              </h1>
              <div className="flex items-center gap-2 pt-1.5">
                {previous?.href && (
                  <Link
                    href={previous.href}
                    className="inline-flex size-7 items-center justify-center rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  >
                    <Icons.arrowRight className="size-4 rotate-180" />
                    <span className="sr-only">Previous</span>
                  </Link>
                )}
                {next?.href && (
                  <Link
                    href={next.href}
                    className="inline-flex size-7 items-center justify-center rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  >
                    <Icons.arrowRight className="size-4" />
                    <span className="sr-only">Next</span>
                  </Link>
                )}
              </div>
            </div>
            {description && (
              <p className="text-balance text-base text-muted-foreground sm:text-[1.05rem]">
                {description}
              </p>
            )}
          </div>

          {/* Content */}
          <div className="w-full flex-1 prose-doc">{children}</div>
        </div>

        {/* Bottom pager */}
        <div className="mx-auto flex h-16 w-full items-center gap-2 px-4 lg:px-0 mb-12">
          {previous?.href && (
            <Link
              href={previous.href}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-secondary px-3 text-sm text-secondary-foreground hover:bg-secondary/80"
            >
              <Icons.arrowRight className="size-3.5 rotate-180" />
              {previous.title}
            </Link>
          )}
          {next?.href && (
            <Link
              href={next.href}
              className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-md bg-secondary px-3 text-sm text-secondary-foreground hover:bg-secondary/80"
            >
              {next.title}
              <Icons.arrowRight className="size-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Table of Contents sidebar */}
      {toc && toc.length > 0 && (
        <div className="sticky top-[3.5rem] z-30 ml-auto hidden h-[calc(100svh-3.5rem)] w-64 flex-col gap-4 overflow-hidden pb-8 lg:flex">
          <div className="pt-6" />
          <div className="overflow-y-auto px-6">
            <DocsTableOfContents items={toc} />
          </div>
        </div>
      )}
    </div>
  )
}
