import { BarChart3 } from 'lucide-react'

interface ResponseUsageProps {
  usageCount: number
}

export function ResponseUsage({ usageCount }: ResponseUsageProps) {
  const label = `${usageCount} ${usageCount === 1 ? 'use' : 'uses'}`

  return (
    <span
      aria-label={label}
      className="inline-flex items-center gap-1 text-xs font-medium tabular-nums text-muted-foreground"
      title={label}
    >
      <BarChart3 aria-hidden="true" className="size-3.5" />
      <span>{usageCount}</span>
      <span className="sr-only">{usageCount === 1 ? 'use' : 'uses'}</span>
    </span>
  )
}
