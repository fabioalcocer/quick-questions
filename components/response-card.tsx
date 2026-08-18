'use client'

import { ResponseActions } from '@/components/response-actions'
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
  onRephrase: (response: QuickResponse) => void
}

export function ResponseCard({
  response,
  onCopy,
  onDelete,
  onEdit,
  onRephrase,
}: ResponseCardProps) {
  const { copied, copyResponse } = useCopyResponse(response, onCopy)

  return (
    <Card
      className="group cursor-pointer gap-0 rounded-md border-2 border-blue-100 bg-gradient-to-br from-slate-50 to-blue-50 py-0 pt-5 shadow-sm transition-all duration-300 hover:border-blue-200 hover:shadow-md active:scale-[0.98] dark:border-zinc-800 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-800 dark:hover:border-zinc-700"
      onClick={() => {
        copyResponse().catch(() => null)
      }}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-2">
          <Badge
            className={`${getLanguageBadgeClassName(response.language)} cursor-default px-3 py-1.5 text-sm font-medium shadow-sm`}
            variant="secondary"
          >
            {response.language}
          </Badge>
          <div className="transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
            <ResponseActions
              copied={copied}
              response={response}
              onCopy={copyResponse}
              onDelete={onDelete}
              onEdit={onEdit}
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
