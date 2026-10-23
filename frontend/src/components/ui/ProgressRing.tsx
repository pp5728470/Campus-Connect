import { cn } from '@/lib/cn'

interface ProgressRingProps {
  /** 0–100 */
  value: number
  size?: number
  strokeWidth?: number
  label?: string
  className?: string
}

/** Circular SVG progress ring (rotated so progress starts at 12 o'clock). */
export function ProgressRing({
  value,
  size = 84,
  strokeWidth = 9,
  label,
  className,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        role="img"
        aria-label={label ?? `Progress ${Math.round(clamped)} percent`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--line)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      {label && <p className="m-0 text-[13px] text-muted">{label}</p>}
    </div>
  )
}
