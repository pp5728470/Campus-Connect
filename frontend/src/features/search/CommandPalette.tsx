import { BookOpen, ClipboardList, FileText, Search, type LucideIcon } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Skeleton } from '@/components/ui/Skeleton'
import { MIN_SEARCH_LENGTH, useSearch } from '@/hooks/use-search'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { cn } from '@/lib/cn'
import type { SearchResult, SearchResultType } from '@/types'

const GROUPS: { type: SearchResultType; label: string; icon: LucideIcon }[] = [
  { type: 'CLASS', label: 'Classes', icon: BookOpen },
  { type: 'ASSIGNMENT', label: 'Assignments', icon: ClipboardList },
  { type: 'MATERIAL', label: 'Materials', icon: FileText },
]

const optionId = (listId: string, index: number) => `${listId}-option-${index}`

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

function PaletteBody({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const listId = useId()
  const debounced = useDebouncedValue(query, 250)
  const { data, isFetching, isError, refetch } = useSearch(debounced)
  const hasQuery = query.trim().length >= MIN_SEARCH_LENGTH
  const results = useMemo(() => (hasQuery ? (data?.results ?? []) : []), [hasQuery, data])

  // Grouped for display, flattened so arrow keys move through one list in the same order.
  const grouped = useMemo(() => {
    const groups = GROUPS.map((group) => ({ ...group, items: results.filter((result) => result.type === group.type) }))
      .filter((group) => group.items.length > 0)
    // `offset` is the position of the group's first item in the flattened list.
    return groups.map((group, i) => ({
      ...group,
      offset: groups.slice(0, i).reduce((sum, earlier) => sum + earlier.items.length, 0),
    }))
  }, [results])
  const flat = useMemo(() => grouped.flatMap((group) => group.items), [grouped])

  // Keep the highlighted option visible while moving with the arrow keys.
  useEffect(() => {
    document.getElementById(optionId(listId, activeIndex))?.scrollIntoView({ block: 'nearest' })
  }, [listId, activeIndex])

  const select = (result: SearchResult) => {
    onClose()
    navigate(result.link)
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (flat.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => (index + 1) % flat.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => (index - 1 + flat.length) % flat.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const result = flat[activeIndex]
      if (result) select(result)
    }
  }

  const isWaiting = hasQuery && (isFetching || debounced.trim() !== query.trim()) && flat.length === 0

  return (
    <div>
      <div className="flex items-center gap-3 border-b border-border px-4">
        <Search className="size-4 shrink-0 text-muted" aria-hidden="true" />
        <input
          autoFocus
          role="combobox"
          aria-label="Search classes, assignments and materials"
          aria-expanded={flat.length > 0}
          aria-controls={listId}
          aria-activedescendant={flat.length > 0 ? optionId(listId, activeIndex) : undefined}
          aria-autocomplete="list"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setActiveIndex(0)
          }}
          onKeyDown={onKeyDown}
          placeholder="Search classes, assignments and materials"
          className="w-full bg-transparent py-4 text-body text-ink placeholder:text-muted focus-visible:outline-none"
        />
        <kbd className="hidden rounded-lg border border-border px-2 py-1 text-meta text-muted sm:block">Esc</kbd>
      </div>

      <div className="max-h-96 overflow-y-auto" aria-live="polite">
        {!hasQuery && (
          <p className="px-4 py-6 text-center text-body text-muted">
            Type at least {MIN_SEARCH_LENGTH} characters to search.
          </p>
        )}

        {isWaiting && !isError && (
          <div role="status" aria-label="Searching" className="flex flex-col gap-2 p-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-8" />
            ))}
          </div>
        )}

        {hasQuery && isError && (
          <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
            <p role="alert" className="text-body text-danger">
              Search failed.
            </p>
            <button type="button" onClick={() => void refetch()} className="text-body font-medium text-accent hover:underline">
              Try again
            </button>
          </div>
        )}

        {hasQuery && !isWaiting && !isError && data && flat.length === 0 && (
          <p className="px-4 py-6 text-center text-body text-muted">No results for &ldquo;{debounced.trim()}&rdquo;.</p>
        )}

        {flat.length > 0 && (
          <ul id={listId} role="listbox" aria-label="Search results" className="flex flex-col gap-2 py-2">
            {grouped.map((group) => (
              <li key={group.type} role="presentation">
                <p className="px-4 py-1 text-meta font-medium text-muted">{group.label}</p>
                <ul role="presentation">
                  {group.items.map((result, itemIndex) => {
                    const current = group.offset + itemIndex
                    const Icon = group.icon
                    return (
                      <li
                        key={`${result.type}-${result.id}`}
                        id={optionId(listId, current)}
                        role="option"
                        aria-selected={current === activeIndex}
                        onMouseMove={() => setActiveIndex(current)}
                        onClick={() => select(result)}
                        className={cn(
                          'flex cursor-pointer items-center gap-3 px-4 py-2',
                          current === activeIndex && 'bg-hover',
                        )}
                      >
                        <Icon className="size-4 shrink-0 text-muted" aria-hidden="true" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-body font-medium">{result.title}</span>
                          {result.subtitle && <span className="block truncate text-meta text-muted">{result.subtitle}</span>}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

/** Ctrl+K search dialog. Built on <dialog> for focus trapping and Escape handling. */
export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-label="Search"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onMouseDown={(event) => {
        if (event.target === ref.current) onClose()
      }}
      className="mx-auto mb-auto mt-16 w-full max-w-xl rounded-xl border border-border bg-surface p-0 text-ink shadow-card backdrop:bg-black/40"
    >
      {open && <PaletteBody onClose={onClose} />}
    </dialog>
  )
}
