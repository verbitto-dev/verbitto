'use client'

import mermaid from 'mermaid'
import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

// Initialize mermaid with custom settings
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  themeVariables: {
    primaryColor: '#6366f1',
    primaryTextColor: '#f8fafc',
    primaryBorderColor: '#4f46e5',
    lineColor: '#64748b',
    secondaryColor: '#1e293b',
    tertiaryColor: '#0f172a',
    background: '#0f172a',
    mainBkg: '#1e293b',
    nodeBorder: '#4f46e5',
    clusterBkg: '#1e293b',
    clusterBorder: '#334155',
    titleColor: '#f8fafc',
    actorTextColor: '#f8fafc',
    actorLineColor: '#64748b',
  },
})

interface MermaidProps {
  chart: string
  className?: string
}

export function Mermaid({ chart, className }: MermaidProps) {
  const ref = useRef<HTMLDivElement>(null)
  const id = useId().replace(/:/g, '-')
  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const renderChart = async () => {
      if (!ref.current) return

      try {
        // Validate and render the mermaid chart
        const { svg } = await mermaid.render(`mermaid-${id}`, chart)
        setSvg(svg)
        setError(null)
      } catch (err) {
        console.error('Mermaid rendering error:', err)
        setError(err instanceof Error ? err.message : 'Failed to render diagram')
        setSvg(null)
      }
    }

    renderChart()
  }, [chart, id])

  if (error) {
    return (
      <div
        className={cn(
          'my-4 rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400',
          className
        )}
      >
        <p className="font-medium">Mermaid Error</p>
        <pre className="mt-2 overflow-x-auto text-xs">{error}</pre>
        <details className="mt-2">
          <summary className="cursor-pointer text-xs">Show source</summary>
          <pre className="mt-2 overflow-x-auto text-xs">{chart}</pre>
        </details>
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className={cn(
        'my-4 flex justify-center overflow-x-auto rounded-lg border bg-slate-900 p-4',
        className
      )}
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    />
  )
}
