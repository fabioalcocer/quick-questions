'use client'

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import type { Category, QuickResponse, Topic } from '@/lib/quick-responses'
import Fuse, { type FuseResult, type FuseResultMatch } from 'fuse.js'
import { Copy, Search } from 'lucide-react'
import { Fragment, useEffect, useMemo, useState } from 'react'

interface SearchEntry {
  categoryDescription: string
  categoryTitle: string
  id: string
  language: string
  response: QuickResponse
  text: string
  topicDescription: string
  topicId: string
  topicTitle: string
}

interface GlobalSearchProps {
  categories: Category[]
  responses: QuickResponse[]
  topics: Topic[]
  onCopy: (response: QuickResponse) => Promise<void>
}

const SEARCH_KEYS = [
  { name: 'text', weight: 0.55 },
  { name: 'categoryTitle', weight: 0.15 },
  { name: 'categoryDescription', weight: 0.05 },
  { name: 'topicTitle', weight: 0.12 },
  { name: 'topicDescription', weight: 0.03 },
  { name: 'language', weight: 0.1 },
] as const

function getMatch(
  matches: readonly FuseResultMatch[] | undefined,
  key: keyof SearchEntry,
) {
  return matches?.find((match) => match.key === key)
}

function HighlightedText({
  indices,
  text,
}: {
  indices?: readonly [number, number][]
  text: string
}) {
  if (!indices?.length) {
    return text
  }

  const parts: React.ReactNode[] = []
  let cursor = 0

  for (const [start, end] of indices) {
    if (start > cursor) {
      parts.push(text.slice(cursor, start))
    }

    parts.push(
      <mark
        className="rounded-sm bg-primary/15 px-0.5 text-current"
        key={`${start}-${end}`}
      >
        {text.slice(start, end + 1)}
      </mark>,
    )
    cursor = end + 1
  }

  if (cursor < text.length) {
    parts.push(text.slice(cursor))
  }

  return parts
}

function getMatchedExcerpt(
  text: string,
  indices: readonly [number, number][] | undefined,
) {
  const excerptLength = 180
  const firstMatchStart = indices?.[0]?.[0] ?? 0
  const unclampedStart = Math.max(0, firstMatchStart - 60)
  const start = Math.min(
    unclampedStart,
    Math.max(0, text.length - excerptLength),
  )
  const end = Math.min(text.length, start + excerptLength)
  const hasPrefix = start > 0
  const prefix = hasPrefix ? '…' : ''
  const suffix = end < text.length ? '…' : ''
  const excerptIndices = indices
    ?.filter(([matchStart, matchEnd]) => matchEnd >= start && matchStart < end)
    .map(
      ([matchStart, matchEnd]) =>
        [
          Math.max(matchStart, start) - start + prefix.length,
          Math.min(matchEnd, end - 1) - start + prefix.length,
        ] as [number, number],
    )

  return {
    indices: excerptIndices,
    text: `${prefix}${text.slice(start, end)}${suffix}`,
  }
}

function SearchResultItem({
  result,
  onSelect,
}: {
  result: FuseResult<SearchEntry>
  onSelect: (response: QuickResponse) => void
}) {
  const { item, matches } = result
  const textMatch = getMatch(matches, 'text')
  const topicMatch = getMatch(matches, 'topicTitle')
  const categoryMatch = getMatch(matches, 'categoryTitle')
  const languageMatch = getMatch(matches, 'language')
  const excerpt = getMatchedExcerpt(item.text, textMatch?.indices)

  return (
    <CommandItem
      className="items-start gap-3 py-3"
      onSelect={() => onSelect(item.response)}
      value={item.id}
    >
      <Copy className="mt-0.5 size-4 text-muted-foreground" />
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-sm leading-relaxed">
          <HighlightedText indices={excerpt.indices} text={excerpt.text} />
        </span>
        <span className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <span className="truncate">
            <HighlightedText
              indices={categoryMatch?.indices}
              text={item.categoryTitle}
            />
          </span>
          <span aria-hidden="true">·</span>
          <span className="shrink-0">
            <HighlightedText
              indices={languageMatch?.indices}
              text={item.language}
            />
          </span>
          {topicMatch ? (
            <span className="sr-only">
              <HighlightedText
                indices={topicMatch.indices}
                text={item.topicTitle}
              />
            </span>
          ) : null}
        </span>
      </span>
      <span className="mt-0.5 hidden shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:inline">
        Copy
      </span>
    </CommandItem>
  )
}

export function GlobalSearch({
  categories,
  responses,
  topics,
  onCopy,
}: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [modifierLabel, setModifierLabel] = useState('Ctrl')

  const entries = useMemo(() => {
    const topicsById = new Map(topics.map((topic) => [topic.id, topic]))
    const categoriesById = new Map(
      categories.map((category) => [category.id, category]),
    )

    return responses.map((response): SearchEntry => {
      const category = categoriesById.get(response.category_id)
      const topic = category?.topic_id
        ? topicsById.get(category.topic_id)
        : undefined

      return {
        categoryDescription: category?.description ?? '',
        categoryTitle: category?.title ?? 'Uncategorized',
        id: response.id,
        language: response.language,
        response,
        text: response.text,
        topicDescription: topic?.description ?? '',
        topicId: topic?.id ?? 'uncategorized',
        topicTitle: topic?.title ?? 'Uncategorized',
      }
    })
  }, [categories, responses, topics])

  const fuse = useMemo(
    () =>
      new Fuse(entries, {
        ignoreDiacritics: true,
        includeMatches: true,
        keys: [...SEARCH_KEYS],
        minMatchCharLength: 2,
        threshold: 0.35,
      }),
    [entries],
  )

  const results = useMemo(
    () => (query.trim() ? fuse.search(query.trim(), { limit: 50 }) : []),
    [fuse, query],
  )

  const groupedResults = useMemo(() => {
    const groups = new Map<string, FuseResult<SearchEntry>[]>()

    for (const result of results) {
      const group = groups.get(result.item.topicId) ?? []
      group.push(result)
      groups.set(result.item.topicId, group)
    }

    return [...groups.values()]
  }, [results])

  useEffect(() => {
    setModifierLabel(
      navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl',
    )

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setIsOpen((current) => !current)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setQuery('')
    }
  }

  const handleSelect = async (response: QuickResponse) => {
    try {
      await onCopy(response)
      handleOpenChange(false)
    } catch {
      // Keep the palette open so the user can retry the copy action.
    }
  }

  return (
    <Fragment>
      <button
        aria-label="Search all responses"
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-border/70 bg-muted/35 text-muted-foreground transition-colors hover:bg-muted md:hidden"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <Search className="size-4" />
      </button>
      <button
        className="hidden h-9 w-full max-w-72 min-w-40 items-center justify-between gap-3 rounded-md border border-border/70 bg-muted/25 px-3 text-sm text-muted-foreground shadow-none transition-colors hover:bg-muted/50 md:flex"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <span className="inline-flex min-w-0 items-center gap-2">
          <Search className="size-4 shrink-0" />
          <span className="truncate">Search responses</span>
        </span>
        <KbdGroup className="shrink-0">
          <Kbd>{modifierLabel}</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </button>

      <CommandDialog
        className="top-[38%] sm:max-w-2xl"
        description="Search every response in your library and copy it."
        onOpenChange={handleOpenChange}
        open={isOpen}
        showCloseButton={false}
        title="Search responses"
      >
        <Command shouldFilter={false}>
          <CommandInput
            onValueChange={setQuery}
            placeholder="Search text, language, category, or topic..."
            value={query}
          />
          <CommandList className="max-h-[min(55vh,28rem)]">
            {!query.trim() ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                Start typing to search your entire response library.
              </div>
            ) : null}
            {query.trim() && results.length === 0 ? (
              <CommandEmpty>No matching responses found.</CommandEmpty>
            ) : null}
            {groupedResults.map((group, index) => (
              <CommandGroup
                heading={group[0]?.item.topicTitle}
                key={group[0]?.item.topicId ?? index}
              >
                {group.map((result) => (
                  <SearchResultItem
                    key={result.item.id}
                    onSelect={(response) => {
                      handleSelect(response).catch(() => null)
                    }}
                    result={result}
                  />
                ))}
              </CommandGroup>
            ))}
          </CommandList>
          <div className="flex items-center justify-between gap-3 border-t border-border/70 px-3 py-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-2">
              <KbdGroup>
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
              </KbdGroup>
              Navigate
            </span>
            <span className="flex items-center gap-2">
              <Kbd>Enter</Kbd>
              Copy
              <Kbd>Esc</Kbd>
              Close
            </span>
          </div>
        </Command>
      </CommandDialog>
    </Fragment>
  )
}
