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
import {
  type LibraryExportV1,
  type LibraryImportResult,
  MAX_LIBRARY_FILE_SIZE,
  libraryExportSchema,
} from '@/lib/library-transfer'
import { FileJson, Loader2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

interface LibraryImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported: () => Promise<void>
}

type ImportStep = 'select' | 'preview'

function formatFileSize(bytes: number) {
  return `${(bytes / 1024).toFixed(bytes >= 1024 * 1024 ? 1 : 0)} ${
    bytes >= 1024 * 1024 ? 'MB' : 'KB'
  }`
}

function getImportError(payload: unknown, fallback: string) {
  if (
    payload &&
    typeof payload === 'object' &&
    'message' in payload &&
    typeof payload.message === 'string'
  ) {
    return payload.message
  }
  return fallback
}

export function LibraryImportDialog({
  open,
  onOpenChange,
  onImported,
}: LibraryImportDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<ImportStep>('select')
  const [file, setFile] = useState<File | null>(null)
  const [library, setLibrary] = useState<LibraryExportV1 | null>(null)
  const [preview, setPreview] = useState<LibraryImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const reset = () => {
    setStep('select')
    setFile(null)
    setLibrary(null)
    setPreview(null)
    setError(null)
    setIsLoading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isLoading && !nextOpen) reset()
    onOpenChange(nextOpen)
  }

  const requestImport = async (
    mode: 'preview' | 'apply',
    nextLibrary: LibraryExportV1,
  ) => {
    const response = await fetch(`/api/library/import?mode=${mode}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(nextLibrary),
    })
    const payload: unknown = await response.json().catch(() => null)

    if (!response.ok) {
      throw new Error(getImportError(payload, 'Unable to import this library.'))
    }

    return payload as LibraryImportResult
  }

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    setError(null)
    setPreview(null)
    setLibrary(null)

    if (selectedFile.size > MAX_LIBRARY_FILE_SIZE) {
      setFile(null)
      setError('The library file must be 5 MB or smaller.')
      return
    }

    setIsLoading(true)
    try {
      const parsedJson: unknown = JSON.parse(await selectedFile.text())
      const parsedLibrary = libraryExportSchema.safeParse(parsedJson)
      if (!parsedLibrary.success) {
        throw new Error('This file is not a valid quick responses library.')
      }

      const nextPreview = await requestImport('preview', parsedLibrary.data)
      setFile(selectedFile)
      setLibrary(parsedLibrary.data)
      setPreview(nextPreview)
      setStep('preview')
    } catch (nextError) {
      setFile(null)
      setError(
        nextError instanceof Error
          ? nextError.message
          : 'Unable to read this library file.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleApply = async () => {
    if (!library) return

    setIsLoading(true)
    setError(null)
    try {
      const result = await requestImport('apply', library)
      await onImported()
      toast.success(
        `Library imported: ${result.created.topics} topics, ${result.created.categories} categories, and ${result.created.responses} responses added.`,
      )
      handleOpenChange(false)
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : 'Unable to import this library.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  const totals = library
    ? {
        topics: library.topics.length,
        categories: library.categories.length,
        responses: library.responses.length,
      }
    : null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import library</DialogTitle>
          <DialogDescription>
            Merge a shared library without replacing your existing topics,
            categories, or responses.
          </DialogDescription>
        </DialogHeader>

        {step === 'select' ? (
          <div className="space-y-4">
            <input
              ref={inputRef}
              accept="application/json,.json"
              className="sr-only"
              onChange={handleFileChange}
              type="file"
            />
            <button
              className="flex min-h-36 w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 px-5 text-center transition-colors hover:border-primary/60 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-70"
              disabled={isLoading}
              onClick={() => inputRef.current?.click()}
              type="button"
            >
              {isLoading ? (
                <Loader2 className="size-5 animate-spin text-primary" />
              ) : (
                <Upload className="size-5 text-primary" />
              )}
              <span className="text-sm font-medium">
                Choose a JSON library file
              </span>
              <span className="text-xs text-muted-foreground">
                Maximum file size: 5 MB
              </span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
              <FileJson className="size-5 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{file?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {file ? formatFileSize(file.size) : ''} · {totals?.topics}{' '}
                  topics, {totals?.categories} categories, {totals?.responses}{' '}
                  responses
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-md border border-border p-3">
                <p className="text-xs text-muted-foreground">Will be added</p>
                <p className="mt-1 font-medium">
                  {preview?.created.topics} topics ·{' '}
                  {preview?.created.categories} categories ·{' '}
                  {preview?.created.responses} responses
                </p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs text-muted-foreground">
                  Already in your library
                </p>
                <p className="mt-1 font-medium">
                  {preview?.skipped.topics} topics ·{' '}
                  {preview?.skipped.categories} categories ·{' '}
                  {preview?.skipped.responses} responses
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          {step === 'preview' && (
            <Button
              disabled={isLoading}
              onClick={reset}
              type="button"
              variant="outline"
            >
              Choose another file
            </Button>
          )}
          <Button
            disabled={isLoading || !library || !preview}
            onClick={handleApply}
            type="button"
          >
            {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Import library
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
