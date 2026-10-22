import { initials } from '@/lib/format'
import { cn } from '@/lib/cn'

type Size = 'sm' | 'md' | 'lg'

interface AvatarProps {
  name: string
  src?: string | null
  size?: Size
  className?: string
}

const sizes: Record<Size, string> = {
  sm: 'size-6 text-meta',
  md: 'size-8 text-meta',
  lg: 'size-12 text-section',
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const base = cn('inline-flex shrink-0 items-center justify-center rounded-full', sizes[size], className)
  if (src) {
    return <img src={src} alt="" className={cn(base, 'object-cover')} />
  }
  return (
    <span aria-hidden="true" className={cn(base, 'bg-accent-soft font-medium text-accent')}>
      {initials(name)}
    </span>
  )
}
