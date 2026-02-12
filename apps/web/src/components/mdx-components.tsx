'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMDXComponent } from 'next-contentlayer2/hooks'
import type React from 'react'
import { isValidElement, type ReactElement } from 'react'
import { Callout, CodeBlock, Step, Steps } from '@/components/doc-primitives'
import { Mermaid } from '@/components/mermaid'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* Typography primitives                                               */
/* ------------------------------------------------------------------ */

function H1({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      className={cn('mt-2 scroll-m-20 text-3xl font-bold tracking-tight lg:text-4xl', className)}
      {...props}
    />
  )
}

function H2({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        'mt-10 scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight first:mt-0',
        className
      )}
      {...props}
    />
  )
}

function H3({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('mt-8 scroll-m-20 text-xl font-semibold tracking-tight', className)}
      {...props}
    />
  )
}

function H4({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h4
      className={cn('mt-6 scroll-m-20 text-lg font-semibold tracking-tight', className)}
      {...props}
    />
  )
}

function P({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('leading-7 [&:not(:first-child)]:mt-4', className)} {...props} />
}

function Blockquote({ className, ...props }: React.HTMLAttributes<HTMLQuoteElement>) {
  return <blockquote className={cn('mt-6 border-l-2 pl-6 italic', className)} {...props} />
}

function InlineCode({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <code
      className={cn('rounded bg-muted px-1.5 py-0.5 text-sm font-mono', className)}
      {...props}
    />
  )
}

/** Helper to extract text content from React children */
function getTextContent(children: React.ReactNode): string {
  if (typeof children === 'string') return children
  if (typeof children === 'number') return String(children)
  if (!children) return ''
  if (Array.isArray(children)) return children.map(getTextContent).join('')
  if (isValidElement(children)) {
    const element = children as ReactElement<{ children?: React.ReactNode }>
    return getTextContent(element.props.children)
  }
  return ''
}

function Pre({ className, children, ...props }: React.HTMLAttributes<HTMLPreElement>) {
  // Check if this is a mermaid code block
  if (isValidElement(children)) {
    const childElement = children as ReactElement<{
      className?: string
      children?: React.ReactNode
    }>
    const childClassName = childElement.props?.className || ''
    const isMermaid =
      childClassName.includes('language-mermaid') || childClassName.includes('language-mmd')

    if (isMermaid) {
      const chart = getTextContent(childElement.props.children)
      return <Mermaid chart={chart} />
    }
  }

  return (
    <pre
      className={cn(
        'my-4 overflow-x-auto rounded-lg border p-4 text-sm leading-relaxed [&>code]:bg-transparent [&>code]:p-0',
        className
      )}
      {...props}
    >
      {children}
    </pre>
  )
}

function Ul({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return <ul className={cn('my-4 ml-6 list-disc space-y-2 leading-7', className)} {...props} />
}

function Ol({ className, ...props }: React.HTMLAttributes<HTMLOListElement>) {
  return <ol className={cn('my-4 ml-6 list-decimal space-y-2 leading-7', className)} {...props} />
}

function Li({ className, ...props }: React.HTMLAttributes<HTMLLIElement>) {
  return <li className={cn('leading-7', className)} {...props} />
}

function Hr({ className, ...props }: React.HTMLAttributes<HTMLHRElement>) {
  return <hr className={cn('my-8', className)} {...props} />
}

function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="my-6 w-full overflow-x-auto">
      <table className={cn('w-full text-sm', className)} {...props} />
    </div>
  )
}

function Thead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('border-b', className)} {...props} />
}

function Tr({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('border-b transition-colors hover:bg-muted/50', className)} {...props} />
}

function Th({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'h-10 px-3 text-left align-middle font-medium text-muted-foreground',
        className
      )}
      {...props}
    />
  )
}

function Td({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-3 py-2 align-middle', className)} {...props} />
}

function MdxImage({ alt, ...props }: React.ComponentPropsWithoutRef<typeof Image>) {
  return <Image alt={alt} className="rounded-lg border" {...props} />
}

function MdxLink({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (href?.startsWith('/')) {
    return (
      <Link href={href} {...props}>
        {children}
      </Link>
    )
  }
  if (href?.startsWith('#')) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  )
}

/* ------------------------------------------------------------------ */
/* Component map                                                       */
/* ------------------------------------------------------------------ */

const components = {
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  p: P,
  blockquote: Blockquote,
  ul: Ul,
  ol: Ol,
  li: Li,
  hr: Hr,
  table: Table,
  thead: Thead,
  tr: Tr,
  th: Th,
  td: Td,
  pre: Pre,
  code: InlineCode,
  a: MdxLink,
  img: MdxImage,
  Image: MdxImage,
  Callout,
  CodeBlock,
  Steps,
  Step,
  Mermaid,
}

/* ------------------------------------------------------------------ */
/* Renderer                                                            */
/* ------------------------------------------------------------------ */

interface MdxProps {
  code: string
}

export function Mdx({ code }: MdxProps) {
  const Component = useMDXComponent(code)
  return (
    <div className="mdx">
      <Component components={components} />
    </div>
  )
}
