import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  /** lg is used for previews that need more room. */
  size?: 'md' | 'lg'
  children: ReactNode
}

/**
 * Dialog built on the native <dialog> element, which provides focus trapping,
 * Escape handling and an inert background.
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
      // A click on the backdrop targets the dialog element itself.
      onMouseDown={(event) => {
        if (event.target === ref.current) onClose()
      }}
      className={cn(
        'm-auto w-full rounded-lg border border-border bg-surface p-0 text-ink backdrop:bg-black/40',
        size === 'lg' ? 'max-w-4xl' : 'max-w-lg',
      )}
    >
      {open && (
        <div className="flex max-h-[calc(100vh-32px)] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-border p-4">
            <div>
              <h2 id={titleId} className="text-section font-semibold">
                {title}
              </h2>
              {description && <p className="mt-1 text-body text-muted">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded-lg p-1 text-muted hover:bg-hover hover:text-ink"
            >
              <X className="size-6" aria-hidden="true" />
            </button>
          </div>
          <div className="overflow-y-auto p-4">{children}</div>
        </div>
      )}
    </dialog>
  )
}

