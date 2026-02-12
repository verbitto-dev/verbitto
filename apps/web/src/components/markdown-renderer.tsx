'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-semibold mb-1.5">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
          p: ({ children }) => <p className="text-sm mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => (
            <ul className="text-sm list-disc pl-5 mb-2 space-y-0.5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="text-sm list-decimal pl-5 mb-2 space-y-0.5">{children}</ol>
          ),
          li: ({ children }) => <li className="text-sm">{children}</li>,
          code: ({ children, className: codeClassName }) => {
            const isBlock = codeClassName?.includes('language-')
            if (isBlock) {
              return (
                <pre className="bg-muted rounded-md p-3 mb-2 overflow-x-auto">
                  <code className="text-xs font-mono">{children}</code>
                </pre>
              )
            }
            return (
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
            )
          },
          pre: ({ children }) => <>{children}</>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand underline underline-offset-2 hover:text-brand/80"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-brand/30 pl-3 my-2 text-sm text-muted-foreground italic">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-2">
              <table className="text-sm border-collapse w-full">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border px-2 py-1 bg-muted text-left text-xs font-medium">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-2 py-1 text-xs">{children}</td>
          ),
          hr: () => <hr className="my-3 border-border" />,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
