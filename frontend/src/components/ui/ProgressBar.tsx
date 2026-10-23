import { cn } from '@/lib/cn'

interface ProgressBarProps {
  /** 0–100 */
  value: number
  label?: string
  /** Light track for use on coloured notebook covers. */
  onCover?: boolean
  className?: string
}

/** Horizontal progress track with a filled segment. */
export function ProgressBar({ value, label, onCover = false, className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 text-[11px]',
        onCover ? 'text-white/85' : 'text-muted',
        className,
      )}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? `Progress ${Math.round(clamped)} percent`}
    >
      <i
        className={cn(
          'block h-1 flex-1 overflow-hidden rounded-sm',
          onCover ? 'bg-white/20' : 'bg-line',
        )}
        aria-hidden="true"
      >
        <em
          className={cn('block h-full rounded-sm', onCover ? 'bg-white' : 'bg-accent')}
          style={{ width: `${clamped}%` }}
        />
      </i>
      {label && <span className="shrink-0 whitespace-nowrap">{label}</span>}
    </div>
  )
}
