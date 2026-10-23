import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface PaperLabelProps {
  title: string
  subtitle?: string
  className?: string
  /** Larger ruled lines for class banners. */
  size?: 'default' | 'banner'
  children?: ReactNode
}

/** Ruled paper label with Caveat “pen” title and a red margin line. */
export function PaperLabel({ title, subtitle, className, size = 'default', children }: PaperLabelProps) {
  return (
    <div
      className={cn(
        'paper-label',
        size === 'banner' &&
          'max-w-[400px] px-5 py-2 pl-[26px] [background-position:0_0,0_6px] [background-size:100%_100%,100%_30px]',
        className,
      )}
    >
      <b className={cn('paper-label-title', size === 'banner' && 'text-[38px] leading-9')}>{title}</b>
      {subtitle && <span className={cn('paper-label-meta', size === 'banner' && 'text-[13px] leading-6')}>{subtitle}</span>}
      {children}
    </div>
  )
}
