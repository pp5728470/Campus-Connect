import { Ellipsis, Pin, PinOff, Send, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { Dropdown } from '@/components/ui/Dropdown'
import { FileChipList } from '@/components/ui/FileChip'
import { useToast } from '@/components/ui/Toast'
import {
  useAddComment,
  useDeleteAnnouncement,
  useDeleteComment,
  useSetPinned,
} from '@/hooks/use-announcements'
import { getErrorMessage } from '@/lib/errors'
import { timeAgo } from '@/lib/format'
import type { Announcement, Comment } from '@/types'

/** Comments shown before the rest are collapsed behind a toggle. */
const VISIBLE_COMMENTS = 2

interface AnnouncementCardProps {
  announcement: Announcement
  classId: number
  isTeacher: boolean
  currentUserId: number
}

function CommentRow({
  comment,
  canDelete,
  onDelete,
}: {
  comment: Comment
  canDelete: boolean
  onDelete: () => void
}) {
  return (
    <li className="flex items-start gap-2">
      <Avatar name={comment.authorName} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="text-meta">
          <span className="font-semibold">{comment.authorName}</span>
          <span className="text-muted"> &middot; {timeAgo(comment.createdAt)}</span>
        </p>
        <p className="whitespace-pre-wrap break-words text-body">{comment.body}</p>
      </div>
      {canDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete comment by ${comment.authorName}`}
          className="rounded-lg p-1 text-muted hover:bg-hover hover:text-ink"
        >
          <Trash2 className="size-4" aria-hidden={true} />
        </button>
      )}
    </li>
  )
}

export function AnnouncementCard({ announcement, classId, isTeacher, currentUserId }: AnnouncementCardProps) {
  const toast = useToast()
  const setPinned = useSetPinned(classId)
  const deleteAnnouncement = useDeleteAnnouncement(classId)
  const addComment = useAddComment(classId)
  const deleteComment = useDeleteComment(classId)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [draft, setDraft] = useState('')

  const comments = showAll ? announcement.comments : announcement.comments.slice(-VISIBLE_COMMENTS)
  const hidden = announcement.comments.length - comments.length

  const togglePin = async () => {
    try {
      await setPinned.mutateAsync({ id: announcement.id, pinned: !announcement.pinned })
      toast.success(announcement.pinned ? 'Unpinned' : 'Pinned to top')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const remove = async () => {
    try {
      await deleteAnnouncement.mutateAsync(announcement.id)
      toast.success('Announcement deleted')
      setConfirmDelete(false)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const submitComment = async (event: FormEvent) => {
    event.preventDefault()
    const body = draft.trim()
    if (!body) return
    try {
      await addComment.mutateAsync({ id: announcement.id, body })
      setDraft('')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const removeComment = async (commentId: number) => {
    try {
      await deleteComment.mutateAsync({ id: announcement.id, commentId })
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex items-start gap-3">
        <Avatar name={announcement.authorName} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-body font-semibold">{announcement.authorName}</p>
          <p className="text-meta text-muted">
            {timeAgo(announcement.createdAt)}
            {announcement.pinned && <span className="font-medium text-accent"> &middot; Pinned</span>}
          </p>
        </div>
        {isTeacher && (
          <Dropdown
            label="Announcement actions"
            trigger={<Ellipsis className="size-6 p-1 text-muted" aria-hidden={true} />}
            items={[
              {
                label: announcement.pinned ? 'Unpin' : 'Pin to top',
                icon: announcement.pinned ? PinOff : Pin,
                onSelect: () => void togglePin(),
              },
              { label: 'Delete', icon: Trash2, danger: true, onSelect: () => setConfirmDelete(true) },
            ]}
          />
        )}
      </div>

      <p className="whitespace-pre-wrap break-words text-body">{announcement.body}</p>
      <FileChipList files={announcement.attachments} />

      <div className="flex flex-col gap-3 border-t border-border pt-4">
        {announcement.comments.length > 0 && (
          <>
            <h3 className="text-meta font-semibold text-muted">
              {announcement.comments.length} class comment{announcement.comments.length > 1 ? 's' : ''}
            </h3>
            {hidden > 0 && (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="self-start rounded-lg text-meta font-medium text-accent hover:underline"
              >
                Show {hidden} earlier comment{hidden > 1 ? 's' : ''}
              </button>
            )}
            <ul className="flex flex-col gap-3">
              {comments.map((comment) => (
                <CommentRow
                  key={comment.id}
                  comment={comment}
                  canDelete={comment.authorId === currentUserId}
                  onDelete={() => void removeComment(comment.id)}
                />
              ))}
            </ul>
          </>
        )}

        <form onSubmit={(event) => void submitComment(event)} className="flex items-center gap-2">
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            aria-label={`Add a class comment to the post by ${announcement.authorName}`}
            placeholder="Add a class comment"
            maxLength={2000}
            className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-body placeholder:text-muted focus-visible:border-accent focus-visible:outline-offset-0"
          />
          <Button
            type="submit"
            variant="secondary"
            aria-label="Post comment"
            loading={addComment.isPending}
            disabled={!draft.trim()}
          >
            <Send className="size-4" aria-hidden={true} />
          </Button>
        </form>
      </div>

      <ConfirmModal
        open={confirmDelete}
        title="Delete announcement"
        description="This removes the announcement and its comments for everyone in the class."
        confirmLabel="Delete"
        loading={deleteAnnouncement.isPending}
        onConfirm={() => void remove()}
        onClose={() => setConfirmDelete(false)}
      />
    </Card>
  )
}
