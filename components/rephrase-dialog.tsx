'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { QuickResponse } from '@/lib/quick-responses'
import { Check, Copy, Loader2, RotateCcw, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

type RephraseTone = 'shorter' | 'warmer' | 'formal' | 'direct'

const TONES: Array<{
  description: string
  label: string
  value: RephraseTone
}> = [
  {
    description: 'Keep only the essential information.',
    label: 'Shorter',
    value: 'shorter',
  },
  {
    description: 'Use a friendlier, more empathetic voice.',
    label: 'Warmer',
    value: 'warmer',
  },
  {
    description: 'Use a polished, professional tone.',
    label: 'More formal',
    value: 'formal',
  },
  {
    description: 'Make the message clearer and more direct.',
    label: 'More direct',
    value: 'direct',
  },
]

interface RephraseDialogProps {
  response: QuickResponse | null
  onClose: () => void
}

export function RephraseDialog({ response, onClose }: RephraseDialogProps) {
  const [tone, setTone] = useState<RephraseTone>('shorter')
  const [result, setResult] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (response) {
      setTone('shorter')
      setResult('')
      setError(null)
      setCopied(false)
    }
  }, [response])

  const handleGenerate = async () => {
    if (!response) return

    setIsGenerating(true)
    setError(null)

    try {
      const request = await fetch('/api/rephrase', {
        body: JSON.stringify({
          language: response.language,
          text: response.text,
          tone,
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const payload = (await request.json()) as {
        error?: string
        text?: string
      }

      if (!request.ok || !payload.text) {
        throw new Error(payload.error || 'Unable to rephrase this response.')
      }

      setResult(payload.text)
      setCopied(false)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to rephrase this response.',
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result)
      setCopied(true)
      toast.success('Rephrased response copied to clipboard!')
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Unable to copy the rephrased response.')
    }
  }

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      open={Boolean(response)}
    >
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="shrink-0 border-b border-border/70 px-6 py-5 pr-12">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            Rephrase with AI
          </DialogTitle>
          <DialogDescription>
            Choose a direction, review the result, and edit it before copying.
            Your original response will not change.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="space-y-2">
            <Label>Original response · {response?.language}</Label>
            <p className="line-clamp-3 rounded-md border border-border/70 bg-muted/35 px-3 py-2.5 text-sm leading-relaxed text-muted-foreground">
              {response?.text}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Style</Label>
            <div className="grid grid-cols-2 gap-2">
              {TONES.map((option) => {
                const isSelected = tone === option.value
                return (
                  <button
                    aria-pressed={isSelected}
                    className={`rounded-md border px-3 py-2.5 text-left transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/8 text-foreground'
                        : 'border-border/80 bg-background hover:bg-muted/40'
                    }`}
                    key={option.value}
                    onClick={() => setTone(option.value)}
                    type="button"
                  >
                    <span className="block text-sm font-medium">
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                      {option.description}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {error ? (
            <div className="rounded-md border border-destructive/25 bg-destructive/8 px-3 py-2.5 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          {result ? (
            <div className="space-y-2">
              <Label htmlFor="rephrased-response">Rephrased response</Label>
              <Textarea
                className="min-h-40 max-h-[35dvh] resize-y leading-relaxed"
                id="rephrased-response"
                maxLength={4000}
                onChange={(event) => {
                  setResult(event.target.value)
                  setCopied(false)
                }}
                value={result}
              />
              <p className="text-right text-xs text-muted-foreground">
                {result.length}/4000 characters
              </p>
            </div>
          ) : null}
        </div>

        <DialogFooter className="shrink-0 border-t border-border/70 px-6 py-4">
          <Button onClick={onClose} type="button" variant="outline">
            Close
          </Button>
          {result ? (
            <Button
              disabled={isGenerating}
              onClick={() => {
                handleGenerate().catch(() => null)
              }}
              type="button"
              variant="outline"
            >
              {isGenerating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RotateCcw className="size-4" />
              )}
              Regenerate
            </Button>
          ) : null}
          {result ? (
            <Button
              disabled={!result.trim()}
              onClick={() => {
                handleCopy().catch(() => null)
              }}
              type="button"
            >
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
              {copied ? 'Copied' : 'Copy response'}
            </Button>
          ) : (
            <Button
              disabled={isGenerating}
              onClick={() => {
                handleGenerate().catch(() => null)
              }}
              type="button"
            >
              {isGenerating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {isGenerating ? 'Rephrasing...' : 'Rephrase'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
