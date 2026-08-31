'use client'

import { ResponseActions } from '@/components/response-actions'
import { ResponseUsage } from '@/components/response-usage'
import { Badge } from '@/components/ui/badge'
import { useCopyResponse } from '@/hooks/use-copy-response'
import type { QuickResponse } from '@/lib/quick-responses'
import { getLanguageBadgeClassName } from '@/lib/response-language'

interface ResponseListRowProps {
  response: QuickResponse
  onCopy: (response: QuickResponse) => Promise<void>
  onDelete: (response: QuickResponse) => void
  onEdit: (response: QuickResponse) => void
  onTogglePin: (response: QuickResponse) => void
  isPinPending?: boolean
  onRephrase: (response: QuickResponse) => void
}

export function ResponseListRow({
  response,
  onCopy,
  onDelete,
  onEdit,
  onTogglePin,
  isPinPending,
  onRephrase,
}: ResponseListRowProps) {
  const { copied, copyResponse } = useCopyResponse(response, onCopy)

  return (
    <div className="flex min-h-13 items-center gap-3 rounded-md border border-border/80 bg-card px-3 py-2 shadow-xs transition-colors hover:bg-muted/30">
      <Badge
        className={`${getLanguageBadgeClassName(response.language)} shrink-0`}
        variant="secondary"
      >
        {response.language}
      </Badge>
      <ResponseUsage usageCount={response.usage_count} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {response.text}
        </p>
      </div>
      <ResponseActions
        compact
        copied={copied}
        response={response}
        onCopy={copyResponse}
        onDelete={onDelete}
        onEdit={onEdit}
        onTogglePin={onTogglePin}
        isPinPending={isPinPending}
        onRephrase={onRephrase}
      />
    </div>
  )
}
