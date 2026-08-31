'use client'

import { Button } from '@/components/ui/button'
import type { QuickResponse } from '@/lib/quick-responses'
import { Check, Copy, Edit, Pin, Sparkles, Trash2 } from 'lucide-react'

interface ResponseActionsProps {
  compact?: boolean
  copied: boolean
  isPinPending?: boolean
  response: QuickResponse
  onCopy: () => Promise<void>
  onDelete: (response: QuickResponse) => void
  onEdit: (response: QuickResponse) => void
  onTogglePin: (response: QuickResponse) => void
  onRephrase: (response: QuickResponse) => void
}

export function ResponseActions({
  compact = false,
  copied,
  isPinPending = false,
  response,
  onCopy,
  onDelete,
  onEdit,
  onTogglePin,
  onRephrase,
}: ResponseActionsProps) {
  const sizeClassName = compact ? 'size-8' : 'size-9'

  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        aria-label={response.is_pinned ? 'Unpin response' : 'Pin response'}
        aria-pressed={response.is_pinned}
        className={`${sizeClassName} p-0 ${
          response.is_pinned
            ? 'text-primary hover:bg-primary/10 hover:text-primary'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        disabled={isPinPending}
        onClick={(event) => {
          event.stopPropagation()
          onTogglePin(response)
        }}
        size="icon"
        title={response.is_pinned ? 'Unpin' : 'Pin'}
        variant="ghost"
      >
        <Pin className={`size-4 ${response.is_pinned ? 'fill-current' : ''}`} />
      </Button>
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
