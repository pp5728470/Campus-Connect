import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  size?: 'md' | 'lg'
  children: ReactNode
}

/**
 * Dialog built on the native <dialog> element (focus trap, Escape, inert backdrop).
 */
export function Modal({ open, onClose, title, description, size = 'md', children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onMouseDown={(event) => {
        if (event.target === ref.current) onClose()
      }}
      className={cn(
        'm-auto w-full rounded-2xl border border-line bg-surface p-0 text-ink shadow-[var(--shadow)] backdrop:bg-black/40',
        size === 'lg' ? 'max-w-4xl' : 'max-w-lg',
      )}
    >
      {open && (
        <div className="flex max-h-[calc(100vh-32px)] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-line p-5">
            <div>
              <h2 id={titleId} className="font-serif text-[28px] font-normal tracking-[-0.01em]">
                {title}
              </h2>
              {description && <p className="mt-1 text-body text-muted">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded-[10px] p-1 text-muted hover:bg-surface-2 hover:text-ink"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          <div className="overflow-y-auto p-5">{children}</div>
        </div>
      )}
    </dialog>
  )
}
