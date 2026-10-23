import { COVER_COLORS } from '@/lib/covers'
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
  sm: 'size-7 text-[11px]',
  md: 'size-[34px] text-meta',
  lg: 'size-12 text-section',
}

function colorForName(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return COVER_COLORS[hash % COVER_COLORS.length]!.hex
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const base = cn(
    'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white shadow-[0_0_0_2px_var(--surface)]',
    sizes[size],
    className,
  )
  if (src) {
    return <img src={src} alt="" className={cn(base, 'object-cover')} />
  }
  return (
    <span aria-hidden="true" className={base} style={{ backgroundColor: colorForName(name) }}>
      {initials(name)}
    </span>
  )
}
