import { cn } from '@/lib/cn'

interface CountdownProps {
  days: number
  hours: number
  minutes: number
  className?: string
  /** Accessible summary, e.g. "Time left: 2 days, 11 hours, 24 minutes". */
  label?: string
}

/** Days / hours / minutes boxes for assignment deadlines. */
export function Countdown({ days, hours, minutes, className, label }: CountdownProps) {
  const boxes = [
    { value: days, unit: 'days' },
    { value: hours, unit: 'hours' },
    { value: minutes, unit: 'min' },
  ]

  return (
    <div
      className={cn('mt-1 flex gap-2.5', className)}
      role="group"
      aria-label={label ?? `Time left: ${days} days, ${hours} hours, ${minutes} minutes`}
    >
      {boxes.map((box) => (
        <div
          key={box.unit}
          className="flex-1 rounded-[10px] border border-line bg-surface-2 py-2.5 text-center"
        >
          <b className="block font-serif text-[28px] font-normal leading-none">{box.value}</b>
          <span className="text-[11px] text-muted">{box.unit}</span>
        </div>
      ))}
    </div>
  )
}
