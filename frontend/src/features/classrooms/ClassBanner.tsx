import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { Skeleton } from '@/components/ui/Skeleton'
import type { Classroom } from '@/types'

export function ClassBanner({ classroom }: { classroom: Classroom }) {
  const [copied, setCopied] = useState(false)
  const details = [classroom.section, classroom.subject, classroom.room].filter(Boolean)

  const copyCode = async () => {
    await navigator.clipboard.writeText(classroom.classCode)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="flex flex-col gap-4 rounded-lg p-6 text-white sm:min-h-32 sm:justify-end"
      style={{ backgroundColor: classroom.bannerColor }}
    >
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-title font-semibold">{classroom.name}</h1>
          {classroom.archived && (
            <span className="rounded-lg bg-white px-2 py-1 text-meta font-medium text-warning">Archived</span>
          )}
        </div>
        {details.length > 0 && <p className="text-body">{details.join(' \u00B7 ')}</p>}
        <p className="text-body">Taught by {classroom.ownerName}</p>
      </div>

      {classroom.myRole === 'TEACHER' && (
        <div className="flex items-center gap-2 text-body">
          <span>Class code</span>
          <code className="rounded-lg bg-white px-2 py-1 font-mono text-body font-medium tracking-wider text-ink">
            {classroom.classCode}
          </code>
          <button
            type="button"
            onClick={() => void copyCode()}
            aria-label="Copy class code"
            className="rounded-lg p-1 hover:bg-white/20"
          >
            {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
          </button>
          <span role="status" className="text-meta">
            {copied ? 'Copied' : ''}
          </span>
        </div>
      )}
    </div>
  )
}

export function ClassBannerSkeleton() {
  return <Skeleton className="h-32" />
}
