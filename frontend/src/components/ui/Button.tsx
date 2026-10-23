import { Loader2 } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'md' | 'sm' | 'lg'

interface ButtonProps extends ComponentProps<'button'> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variants: Record<Variant, string> = {
  primary:
    'bg-accent text-accent-ink border border-transparent shadow-[inset_0_1px_0_rgba(255,255,255,.18),0_1px_2px_rgba(17,22,38,.2),0_6px_14px_-6px_rgba(44,70,196,.55)] hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
  secondary:
    'bg-surface text-ink border border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
  ghost:
    'bg-transparent text-muted border border-transparent hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
  danger:
    'bg-surface text-danger border border-line hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
}

const sizes: Record<Size, string> = {
  sm: 'h-[34px] px-3 text-[13px]',
  md: 'h-10 px-4 text-body',
  lg: 'h-[46px] px-4 text-body',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold whitespace-nowrap transition-[transform,box-shadow] duration-100',
        'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}
