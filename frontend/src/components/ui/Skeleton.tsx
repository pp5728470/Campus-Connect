import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

/** Placeholder block shown while data loads. Size it with className. */
export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-[10px] bg-line', className)}
      {...props}
    />
  )
}
