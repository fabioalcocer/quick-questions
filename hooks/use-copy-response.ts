'use client'

import type { QuickResponse } from '@/lib/quick-responses'
import { useCallback, useEffect, useRef, useState } from 'react'

export function useCopyResponse(
  response: QuickResponse,
  onCopy: (response: QuickResponse) => Promise<void>,
) {
  const [copied, setCopied] = useState(false)
  const resetTimerRef = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current)
      }
    },
    [],
  )

  const copyResponse = useCallback(async () => {
    await onCopy(response)
    setCopied(true)

    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current)
    }

    resetTimerRef.current = window.setTimeout(() => {
      setCopied(false)
      resetTimerRef.current = null
    }, 2000)
  }, [onCopy, response])

  return { copied, copyResponse }
}
