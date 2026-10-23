import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { coverClassName, type CoverId, resolveCoverId } from '@/lib/covers'
import { PaperLabel } from './PaperLabel'

export type NotebookSize = 'card' | 'banner' | 'mini' | 'icon' | 'stack'

interface NotebookCoverProps {
  /** Cover id (teal…) or a hex colour (snapped to the nearest cover). */
  color: CoverId | string
  size?: NotebookSize
  ribbon?: boolean
  corner?: boolean
  children?: ReactNode
  className?: string
  style?: CSSProperties
  /**
   * Convenience for existing call sites: renders a PaperLabel inside the cover.
   * Prefer passing PaperLabel as children in new code.
   */
  title?: string
  subtitle?: string
  showLabel?: boolean
}

const sizeClass: Record<NotebookSize, string> = {
  card: 'nb-size-card flex flex-col gap-3.5 p-[22px_50px_18px_38px]',
  banner: 'nb-size-banner flex items-end justify-between gap-6 p-[28px_66px_28px_44px]',
  mini: 'nb-size-mini',
  icon: 'nb-size-icon',
  stack: 'absolute h-[330px] w-[250px] flex flex-col justify-between p-[34px_46px_30px_36px]',
}

/**
 * Signature notebook cover: stitched spine, elastic band, optional ribbon and
 * folded corner, stacked page-edge shadows. Children render inside.
 */
export function NotebookCover({
  color,
  size = 'card',
  ribbon = size === 'card' || size === 'banner',
  corner = size !== 'icon' && size !== 'mini',
  children,
  className,
  style,
  title,
  subtitle,
  showLabel = true,
}: NotebookCoverProps) {
  const id = resolveCoverId(color)

  return (
    <div className={cn('nb', coverClassName(id), sizeClass[size], className)} style={style} data-cover={id}>
      <span className="nb-elastic" aria-hidden="true" />
      {ribbon && <span className="nb-ribbon" aria-hidden="true" />}
      {corner && <span className="nb-corner" aria-hidden="true" />}
      {showLabel && (title || subtitle) && (
        <PaperLabel
          title={title ?? ''}
          subtitle={subtitle}
          size={size === 'banner' ? 'banner' : 'default'}
          className={size === 'card' ? 'max-w-[240px]' : undefined}
        />
      )}
      {children}
    </div>
  )
}
