import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

/** Flat surface with a 1px border and soft physical shadow. */
export function Card({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('rounded-2xl border border-line bg-surface shadow-[var(--shadow)]', className)}
      {...props}
    />
  )
}
