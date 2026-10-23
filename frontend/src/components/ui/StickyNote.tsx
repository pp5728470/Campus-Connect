import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface StickyNoteProps {
  children: ReactNode
  caption?: string
  className?: string
}

/** Yellow sticky note with tape; Caveat body text only. */
export function StickyNote({ children, caption, className }: StickyNoteProps) {
  return (
    <aside className={cn('sticky-note', className)}>
      <p className="sticky-note-body m-0">{children}</p>
      {caption && <small className="sticky-note-caption">{caption}</small>}
    </aside>
  )
}
