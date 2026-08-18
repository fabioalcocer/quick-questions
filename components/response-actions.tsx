'use client'

import { Button } from '@/components/ui/button'
import type { QuickResponse } from '@/lib/quick-responses'
import { Check, Copy, Edit, Sparkles, Trash2 } from 'lucide-react'

interface ResponseActionsProps {
  compact?: boolean
  copied: boolean
  response: QuickResponse
  onCopy: () => Promise<void>
  onDelete: (response: QuickResponse) => void
  onEdit: (response: QuickResponse) => void
  onRephrase: (response: QuickResponse) => void
}

export function ResponseActions({
  compact = false,
  copied,
  response,
  onCopy,
  onDelete,
  onEdit,
  onRephrase,
}: ResponseActionsProps) {
  const sizeClassName = compact ? 'size-8' : 'size-9'

  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        aria-label={copied ? 'Response copied' : 'Copy response'}
        className={`${sizeClassName} p-0`}
        disabled={copied}
        onClick={(event) => {
          event.stopPropagation()
          onCopy().catch(() => null)
        }}
        size="icon"
        title={copied ? 'Copied' : 'Copy'}
        variant="ghost"
      >
        {copied ? (
          <Check className="size-4 text-primary" />
        ) : (
          <Copy className="size-4" />
        )}
      </Button>
      <Button
        aria-label="Rephrase response with AI"
        className={`${sizeClassName} p-0 text-primary hover:bg-primary/10 hover:text-primary`}
        onClick={(event) => {
          event.stopPropagation()
          onRephrase(response)
        }}
        size="icon"
        title="Rephrase with AI"
        variant="ghost"
      >
        <Sparkles className="size-4" />
      </Button>
      <Button
        aria-label="Edit response"
        className={`${sizeClassName} p-0`}
        onClick={(event) => {
          event.stopPropagation()
          onEdit(response)
        }}
        size="icon"
        title="Edit"
        variant="ghost"
      >
        <Edit className="size-4" />
      </Button>
      <Button
        aria-label="Delete response"
        className={`${sizeClassName} p-0 text-destructive hover:bg-destructive/10 hover:text-destructive`}
        onClick={(event) => {
          event.stopPropagation()
          onDelete(response)
        }}
        size="icon"
        title="Delete"
        variant="ghost"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  )
}
