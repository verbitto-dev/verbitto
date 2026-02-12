'use client'

import { useCallback, useState } from 'react'
import { Icons } from '@/components/icons'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface MarkdownEditorProps {
  id?: string
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  hint?: string
}

export function MarkdownEditor({
  id = 'markdown-editor',
  label = 'Description',
  value,
  onChange,
  placeholder = 'Write your description in Markdown...',
  rows = 4,
  hint,
}: MarkdownEditorProps) {
  const [preview, setPreview] = useState(false)

  const insertMarkdown = useCallback(
    (before: string, after = '') => {
      const textarea = document.getElementById(id) as HTMLTextAreaElement | null
      if (!textarea) return
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selected = value.slice(start, end)
      const replacement = `${before}${selected || 'text'}${after}`
      const newValue = value.slice(0, start) + replacement + value.slice(end)
      onChange(newValue)
      // Restore cursor after React re-render
      requestAnimationFrame(() => {
        textarea.focus()
        const cursorPos = start + before.length + (selected || 'text').length
        textarea.setSelectionRange(cursorPos, cursorPos)
      })
    },
    [id, value, onChange]
  )

  return (
    <div className="space-y-2">
      {label && <Label htmlFor={id}>{label}</Label>}

      {/* Toolbar */}
      <div className="flex items-center gap-1 border rounded-t-md px-2 py-1 bg-muted/30">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => insertMarkdown('**', '**')}
          title="Bold"
        >
          <strong>B</strong>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => insertMarkdown('*', '*')}
          title="Italic"
        >
          <em>I</em>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => insertMarkdown('`', '`')}
          title="Inline Code"
        >
          <Icons.code className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => insertMarkdown('[', '](url)')}
          title="Link"
        >
          <Icons.link className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => insertMarkdown('- ')}
          title="List"
        >
          <Icons.listChecks className="size-3.5" />
        </Button>

        <div className="flex-1" />

        <Button
          type="button"
          variant={preview ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => setPreview(!preview)}
        >
          {preview ? 'Edit' : 'Preview'}
        </Button>
      </div>

      {/* Editor / Preview */}
      {preview ? (
        <div className="min-h-[100px] max-h-[200px] overflow-y-auto border border-t-0 rounded-b-md p-3">
          {value ? (
            <MarkdownRenderer content={value} />
          ) : (
            <p className="text-sm text-muted-foreground italic">Nothing to preview</p>
          )}
        </div>
      ) : (
        <Textarea
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className="rounded-t-none border-t-0 font-mono text-sm"
        />
      )}

      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
