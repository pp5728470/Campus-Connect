import { Megaphone } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { FileUploader } from '@/components/ui/FileUploader'
import { Skeleton } from '@/components/ui/Skeleton'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/Toast'
import { useAnnouncements, useCreateAnnouncement } from '@/hooks/use-announcements'
import { useUploadFiles } from '@/hooks/use-files'
import { getErrorMessage } from '@/lib/errors'
import type { Classroom } from '@/types'
import { AnnouncementCard } from './AnnouncementCard'

interface StreamTabProps {
  classroom: Classroom
  currentUserId: number
}

function Composer({ classroom }: { classroom: Classroom }) {
  const toast = useToast()
  const createAnnouncement = useCreateAnnouncement(classroom.id)
  const uploadFiles = useUploadFiles(classroom.id)
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
      // Files go up first so the announcement can reference their ids.
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
      toast.success('Announcement posted')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setProgress(null)
    }
  }

  return (
    <Card className="flex flex-col gap-4 p-4">
      <Textarea
        label="Announce something to your class"
        placeholder="Share an update, a reminder or a link"
        rows={3}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        error={error ?? undefined}
        disabled={busy}
        maxLength={4000}
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
        <Button loading={busy} onClick={() => void post()}>
          Post
        </Button>
      </div>
    </Card>
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

  // Pinned posts first; the API already orders by date within each group.
  const items = useMemo(() => {
    const all = data?.pages.flatMap((page) => page.content) ?? []
    return [...all.filter((item) => item.pinned), ...all.filter((item) => !item.pinned)]
  }, [data])

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
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
          icon={Megaphone}
          title="Nothing posted yet"
          description={
            isTeacher
              ? 'Post an announcement to share updates and files with your students.'
              : 'Announcements from your teacher will appear here.'
          }
        />
      )}

      {items.map((announcement) => (
        <AnnouncementCard
          key={announcement.id}
          announcement={announcement}
          classId={classroom.id}
          isTeacher={isTeacher}
          currentUserId={currentUserId}
        />
      ))}

      {hasNextPage && (
        <div className="flex justify-center">
          <Button variant="secondary" loading={isFetchingNextPage} onClick={() => void fetchNextPage()}>
            Load older posts
          </Button>
        </div>
      )}
    </div>
  )
}
