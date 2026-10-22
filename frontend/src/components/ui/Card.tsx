import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

/** Flat surface with a 1px border. */
export function Card({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('rounded-lg border border-border bg-surface', className)} {...props} />
}
