import { cn } from '@/lib/cn'

/** Faded mini notebook used in empty states. */
export function EmptyNotebook({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'nb nb-c-steel nb-size-mini inline-block w-14 opacity-40',
        'shadow-[inset_7px_0_0_rgba(0,0,0,0.2),2px_2px_0_-1px_var(--page),2px_2px_0_0_var(--page-edge)]',
        className,
      )}
    >
      <span className="nb-elastic" />
    </span>
  )
}
