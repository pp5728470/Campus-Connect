import { useRef, type KeyboardEvent } from 'react'
import { cn } from '@/lib/cn'

export interface TabItem {
  id: string
  label: string
}

interface TabsProps {
  items: TabItem[]
  value: string
  onChange: (id: string) => void
  /** Accessible name for the tab list. */
  label: string
  /** Prefix used to link each tab to its panel (`${idPrefix}-panel`). */
  idPrefix: string
}

/** Pill-style segmented tabs; selected state uses dark ink on the surface. */
export function Tabs({ items, value, onChange, label, idPrefix }: TabsProps) {
  const listRef = useRef<HTMLDivElement>(null)

  const onKeyDown = (event: KeyboardEvent) => {
    const index = items.findIndex((item) => item.id === value)
    let next = index
    if (event.key === 'ArrowRight') next = (index + 1) % items.length
    else if (event.key === 'ArrowLeft') next = (index - 1 + items.length) % items.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = items.length - 1
    else return
    event.preventDefault()
    onChange(items[next]!.id)
    listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus()
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="flex max-w-full gap-1.5 overflow-x-auto rounded-xl border border-line bg-surface p-1"
    >
      {items.map((item) => {
        const active = item.id === value
        return (
          <button
            key={item.id}
            id={`${idPrefix}-tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={`${idPrefix}-panel`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.id)}
            className={cn(
              'h-9 shrink-0 whitespace-nowrap rounded-lg px-4 text-body font-medium transition-colors',
              active ? 'bg-ink font-semibold text-surface' : 'bg-transparent text-muted hover:text-ink',
            )}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
