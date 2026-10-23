import { Check, Copy, Link2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { NotebookCover } from '@/components/ui/NotebookCover'
import { Skeleton } from '@/components/ui/Skeleton'
import type { Classroom } from '@/types'

export function ClassBanner({ classroom }: { classroom: Classroom }) {
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const details = [classroom.section, classroom.subject, classroom.room].filter(Boolean).join(', ')

  const copyCode = async () => {
    await navigator.clipboard.writeText(classroom.classCode)
    setCopiedCode(true)
    window.setTimeout(() => setCopiedCode(false), 2000)
  }

  const copyInviteLink = async () => {
    const url = `${window.location.origin}/?join=${classroom.classCode}`
    await navigator.clipboard.writeText(url)
    setCopiedLink(true)
    window.setTimeout(() => setCopiedLink(false), 2000)
  }

  return (
    <NotebookCover
      size="banner"
      color={classroom.bannerColor}
      title={classroom.name}
      subtitle={details || `Taught by ${classroom.ownerName}`}
      className="flex-col items-stretch sm:flex-row sm:items-end"
    >
      <div className="relative flex flex-col gap-3 sm:items-end sm:text-right">
        {classroom.archived && (
          <span className="self-start rounded-lg bg-white px-2 py-1 text-meta font-medium text-warning sm:self-end">
            Archived
          </span>
        )}
        {classroom.myRole === 'TEACHER' && (
          <div className="flex flex-col gap-2 text-white sm:items-end">
            <div>
              <small className="block text-meta text-white/85">Class code</small>
              <div className="flex items-center gap-2 sm:justify-end">
                <b className="text-[20px] font-semibold tracking-[0.08em]">{classroom.classCode}</b>
                <button
                  type="button"
                  onClick={() => void copyCode()}
                  aria-label="Copy class code"
                  className="rounded-lg p-1 text-white/90 hover:bg-white/15"
                >
                  {copiedCode ? (
                    <Check className="size-4" aria-hidden="true" />
                  ) : (
                    <Copy className="size-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="border-white/40 bg-white/95 text-ink hover:bg-white"
              onClick={() => void copyInviteLink()}
            >
              {copiedLink ? (
                <Check className="size-3.5" aria-hidden="true" />
              ) : (
                <Link2 className="size-3.5" aria-hidden="true" />
              )}
              {copiedLink ? 'Link copied' : 'Copy invite link'}
            </Button>
            <span role="status" className="sr-only">
              {copiedCode || copiedLink ? 'Copied' : ''}
            </span>
          </div>
        )}
        {classroom.myRole !== 'TEACHER' && (
          <p className="text-meta text-white/88">Taught by {classroom.ownerName}</p>
        )}
      </div>
    </NotebookCover>
  )
}

export function ClassBannerSkeleton() {
  return <Skeleton className="h-[200px] rounded-[6px_14px_14px_6px]" />
}
