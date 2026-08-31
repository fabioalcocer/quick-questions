'use client'

import { ResponseActions } from '@/components/response-actions'
import { ResponseUsage } from '@/components/response-usage'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useCopyResponse } from '@/hooks/use-copy-response'
import type { QuickResponse } from '@/lib/quick-responses'
import { getLanguageBadgeClassName } from '@/lib/response-language'

interface ResponseCardProps {
  response: QuickResponse
  onCopy: (response: QuickResponse) => Promise<void>
  onDelete: (response: QuickResponse) => void
  onEdit: (response: QuickResponse) => void
  onTogglePin: (response: QuickResponse) => void
  isPinPending?: boolean
  onRephrase: (response: QuickResponse) => void
}

export function ResponseCard({
  response,
  onCopy,
  onDelete,
  onEdit,
  onTogglePin,
  isPinPending,
  onRephrase,
}: ResponseCardProps) {
  const { copied, copyResponse } = useCopyResponse(response, onCopy)

  return (
    <Card
      className="group cursor-pointer gap-0 rounded-md border border-border/90 bg-card py-0 pt-5 shadow-xs transition-[border-color,box-shadow,transform] duration-200 hover:border-primary/35 hover:shadow-sm active:scale-[0.99]"
      onClick={() => {
        copyResponse().catch(() => null)
      }}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge
              className={`${getLanguageBadgeClassName(response.language)} cursor-default px-3 py-1.5 text-sm font-medium shadow-sm`}
              variant="secondary"
            >
              {response.language}
            </Badge>
            <ResponseUsage usageCount={response.usage_count} />
          </div>
          <div className="transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
            <ResponseActions
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
        </div>
      </CardHeader>
      <CardContent className="pb-6 pt-0">
        <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-foreground">
          {response.text}
        </p>
      </CardContent>
    </Card>
  )
}
