import { format, parseISO } from 'date-fns'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { FileUploader } from '@/components/ui/FileUploader'
import { Skeleton } from '@/components/ui/Skeleton'
import { StickyNote } from '@/components/ui/StickyNote'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/Toast'
import { useAnnouncements, useCreateAnnouncement } from '@/hooks/use-announcements'
import { useAssignments } from '@/hooks/use-assignments'
import { useUploadFiles } from '@/hooks/use-files'
import { useAuth } from '@/lib/auth-context'
import { getErrorMessage } from '@/lib/errors'
import { dueLabel } from '@/lib/format'
import type { Classroom } from '@/types'
import { AnnouncementCard } from './AnnouncementCard'

interface StreamTabProps {
  classroom: Classroom
  currentUserId: number
}

function Composer({ classroom }: { classroom: Classroom }) {
  const { user } = useAuth()
  const toast = useToast()
  const createAnnouncement = useCreateAnnouncement(classroom.id)
  const uploadFiles = useUploadFiles(classroom.id)
  const [expanded, setExpanded] = useState(false)
  const [body, setBody] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [pinned, setPinned] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const busy = progress !== null || createAnnouncement.isPending

  const post = async () => {
    if (!body.trim()) {
      setError('Write something to announce.')
      return
    }
    setError(null)
    try {
      let fileIds: number[] = []
      if (files.length > 0) {
        setProgress(0)
        const uploaded = await uploadFiles.mutateAsync({ files, onProgress: setProgress })
        fileIds = uploaded.map((file) => file.id)
      }
      await createAnnouncement.mutateAsync({ body: body.trim(), fileIds, pinned })
      setBody('')
      setFiles([])
      setPinned(false)
      setExpanded(false)
      toast.success('Announcement posted')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setProgress(null)
    }
  }

  if (!expanded) {
    return (
      <Card className="mb-4 flex items-center gap-3 p-3.5 shadow-card">
        <Avatar name={user?.fullName ?? 'You'} />
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex h-10 flex-1 items-center rounded-lg border border-border bg-surface-2 px-3.5 text-left text-body text-muted"
        >
          Announce something to your class
        </button>
      </Card>
    )
  }

  return (
    <Card className="mb-4 flex flex-col gap-4 p-4 shadow-card">
      <Textarea
        label="Announce something to your class"
        placeholder="Share an update, a reminder or a link"
        rows={3}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        error={error ?? undefined}
        disabled={busy}
        maxLength={4000}
        autoFocus
      />
      <FileUploader label="Attachments" files={files} onChange={setFiles} progress={progress} disabled={busy} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <label className="flex items-center gap-2 text-body">
          <input
            type="checkbox"
            checked={pinned}
            onChange={(event) => setPinned(event.target.checked)}
            disabled={busy}
            className="size-4 accent-accent"
          />
          Pin to top of the stream
        </label>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              setExpanded(false)
              setError(null)
            }}
          >
            Cancel
          </Button>
          <Button loading={busy} onClick={() => void post()}>
            Post
          </Button>
        </div>
      </div>
    </Card>
  )
}

function ComingUp({
  classroomId,
  pinnedNote,
  isTeacher,
}: {
  classroomId: number
  pinnedNote: { body: string; caption: string } | null
  isTeacher: boolean
}) {
  const { data, isLoading } = useAssignments(classroomId)
  const upcoming = useMemo(() => {
    const now = Date.now()
    return (data?.content ?? [])
      .filter((a) => a.dueAt && new Date(a.dueAt).getTime() >= now - 24 * 60 * 60 * 1000)
      .sort((a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime())
      .slice(0, 5)
  }, [data])

  return (
    <div className="flex flex-col gap-4">
      <aside className="rounded-xl border border-border bg-surface p-5 shadow-card">
        <h3 className="text-body font-semibold">Coming up</h3>
        {isLoading && (
          <div className="mt-3 flex flex-col gap-2" role="status" aria-label="Loading upcoming work">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}
        {!isLoading && upcoming.length === 0 && (
          <p className="mt-3 text-meta text-muted">Nothing due soon.</p>
        )}
        <ul className="mt-2">
          {upcoming.map((assignment) => {
            const due = parseISO(assignment.dueAt!)
            return (
              <li key={assignment.id} className="flex gap-3 border-t border-border py-3 first:border-t-0 first:pt-2">
                <div className="w-11 shrink-0 text-center leading-none">
                  <b className="block font-serif text-[28px] font-normal">{format(due, 'd')}</b>
                  <small className="text-[11px] font-medium text-muted">{format(due, 'EEE')}</small>
                </div>
                <div className="min-w-0">
                  <Link
                    to={`/classes/${classroomId}/assignments/${assignment.id}`}
                    className="block truncate font-medium text-ink no-underline hover:text-accent"
                  >
                    {assignment.title}
                  </Link>
                  <span className="text-meta text-muted">{dueLabel(assignment.dueAt)}</span>
                </div>
              </li>
            )
          })}
        </ul>
        <Link
          to={`/classes/${classroomId}/classwork`}
          className="mt-1 inline-block text-[13px] font-semibold text-accent hover:underline"
        >
          View all
        </Link>
      </aside>

      {pinnedNote && (
        <StickyNote caption={pinnedNote.caption}>
          {pinnedNote.body.length > 120 ? `${pinnedNote.body.slice(0, 117)}…` : pinnedNote.body}
        </StickyNote>
      )}
      {!pinnedNote && isTeacher && (
        <p className="px-1 text-meta text-muted">Pin an announcement to keep a sticky note here.</p>
      )}
    </div>
  )
}

function FeedSkeleton() {
  return (
    <div role="status" aria-label="Loading announcements" className="flex flex-col gap-4">
      {[0, 1, 2].map((i) => (
        <Card key={i} className="flex flex-col gap-3 p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-full" />
            <div className="flex flex-1 flex-col gap-1">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-3 w-1/6" />
            </div>
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </Card>
      ))}
    </div>
  )
}

export function StreamTab({ classroom, currentUserId }: StreamTabProps) {
  const isTeacher = classroom.myRole === 'TEACHER'
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useAnnouncements(
    classroom.id,
  )

  const items = useMemo(() => {
    const all = data?.pages.flatMap((page) => page.content) ?? []
    return [...all.filter((item) => item.pinned), ...all.filter((item) => !item.pinned)]
  }, [data])

  const pinnedNote = useMemo(() => {
    const pinned = items.find((item) => item.pinned)
    if (!pinned) return null
    return {
      body: pinned.body,
      caption: isTeacher ? 'Pinned by you' : `Pinned · ${pinned.authorName}`,
    }
  }, [items, isTeacher])

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
      <div className="order-2 lg:order-1">
        <ComingUp classroomId={classroom.id} pinnedNote={pinnedNote} isTeacher={isTeacher} />
      </div>

      <div className="order-1 min-w-0 lg:order-2">
        {isTeacher && !classroom.archived && <Composer classroom={classroom} />}

        {isLoading && <FeedSkeleton />}

        {isError && (
          <EmptyState
            title="Could not load the stream"
            description="Something went wrong while contacting the server."
            action={
              <Button variant="secondary" onClick={() => void refetch()}>
                Try again
              </Button>
            }
          />
        )}

        {data && items.length === 0 && (
          <EmptyState
            title="Nothing on the stream yet"
            description={
              isTeacher
                ? 'Post an announcement to share updates and files with your students.'
                : 'Your teacher will post announcements here.'
            }
          />
        )}

        {items.map((announcement) => (
          <div key={announcement.id} className="mb-4">
            <AnnouncementCard
              announcement={announcement}
              classId={classroom.id}
              isTeacher={isTeacher}
              currentUserId={currentUserId}
              archived={classroom.archived}
            />
          </div>
        ))}

        {hasNextPage && (
          <div className="flex justify-center">
            <Button variant="secondary" loading={isFetchingNextPage} onClick={() => void fetchNextPage()}>
              Load older posts
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
