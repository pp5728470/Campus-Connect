import { useEffect, useId, useRef, useState, type ComponentType, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface DropdownItem {
  label: string
  icon?: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  onSelect: () => void
  danger?: boolean
}

interface DropdownProps {
  /** Accessible name for the trigger button. */
  label: string
  trigger: ReactNode
  items: DropdownItem[]
  /** Optional non-interactive content shown above the items. */
  header?: ReactNode
  align?: 'left' | 'right'
  triggerClassName?: string
}

export function Dropdown({ label, trigger, items, header, align = 'right', triggerClassName }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  // Close on outside click.
  useEffect(() => {
    if (!open) return
    const handler = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Move focus into the menu when it opens.
  useEffect(() => {
    if (open) menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus()
  }, [open])

  const onMenuKeyDown = (event: KeyboardEvent) => {
    const nodes = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])
    const index = nodes.indexOf(document.activeElement as HTMLButtonElement)
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      nodes[(index + 1) % nodes.length]?.focus()
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      nodes[(index - 1 + nodes.length) % nodes.length]?.focus()
    } else if (event.key === 'Escape') {
      setOpen(false)
      rootRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
    } else if (event.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        className={cn('rounded-lg hover:bg-hover', triggerClassName)}
      >
        {trigger}
      </button>
      {open && (
        <div
          id={menuId}
          ref={menuRef}
          role="menu"
          onKeyDown={onMenuKeyDown}
          className={cn(
            'absolute top-full z-30 mt-1 min-w-48 rounded-lg border border-border bg-surface py-1',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {header && <div className="border-b border-border px-3 py-2">{header}</div>}
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                item.onSelect()
              }}
              className={cn(
                'flex w-full items-center gap-3 px-3 py-2 text-left text-body hover:bg-hover',
                item.danger ? 'text-danger' : 'text-ink',
              )}
            >
              {item.icon && <item.icon className="size-4 text-muted" aria-hidden={true} />}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

