import { Trash2, Users } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { useClassPeople, useRemoveMember } from '@/hooks/use-classrooms'
import { getErrorMessage } from '@/lib/errors'
import { timeAgo } from '@/lib/format'
import type { Classroom, ClassroomMember } from '@/types'

interface PeopleTabProps {
  classroom: Classroom
  currentUserId: number
}

interface MemberSectionProps {
  title: string
  count?: number
  children: ReactNode
}

function MemberSection({ title, count, children }: MemberSectionProps) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between border-b border-border pb-2">
        <h2 className="text-section font-semibold">{title}</h2>
        {count !== undefined && <p className="text-meta text-muted">{count === 1 ? '1 person' : `${count} people`}</p>}
      </div>
      {children}
    </section>
  )
}

function MemberRow({ member, action }: { member: ClassroomMember; action?: ReactNode }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <Avatar name={member.fullName} src={member.avatarUrl} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-body font-medium">{member.fullName}</p>
        <p className="truncate text-meta text-muted">
          {member.email} &middot; Joined {timeAgo(member.joinedAt)}
        </p>
      </div>
      {action}
    </li>
  )
}

function PeopleSkeleton() {
  return (
    <div role="status" aria-label="Loading people" className="flex flex-col gap-4">
      {[0, 1].map((section) => (
        <div key={section} className="flex flex-col gap-2">
          <Skeleton className="h-6 w-32" />
          <Card>
            {[0, 1, 2].map((row) => (
              <div key={row} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex flex-1 flex-col gap-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </Card>
        </div>
      ))}
    </div>
  )
}

export function PeopleTab({ classroom, currentUserId }: PeopleTabProps) {
  const [page, setPage] = useState(0)
  const { data, isLoading, isError, refetch } = useClassPeople(classroom.id, page)
  const removeMember = useRemoveMember(classroom.id)
  const toast = useToast()
  const [pendingRemoval, setPendingRemoval] = useState<ClassroomMember | null>(null)

  const isOwner = classroom.ownerId === currentUserId
  const teachers = data?.content.filter((member) => member.roleInClass === 'TEACHER') ?? []
  const students = data?.content.filter((member) => member.roleInClass === 'STUDENT') ?? []

  const confirmRemoval = async () => {
    if (!pendingRemoval) return
    try {
      await removeMember.mutateAsync(pendingRemoval.userId)
      toast.success(`Removed ${pendingRemoval.fullName}`)
      setPendingRemoval(null)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  if (isLoading) return <PeopleSkeleton />

  if (isError || !data) {
    return (
      <EmptyState
        title="Could not load people"
        description="Something went wrong while contacting the server."
        action={
          <Button variant="secondary" onClick={() => void refetch()}>
            Try again
          </Button>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <MemberSection title="Teachers">
        <Card>
          <ul className="divide-y divide-border">
            {teachers.map((member) => (
              <MemberRow key={member.userId} member={member} />
            ))}
          </ul>
        </Card>
      </MemberSection>

      <MemberSection title="Students" count={students.length}>
        {students.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No students yet"
            description={
              isOwner
                ? `Share the class code ${classroom.classCode} so students can join.`
                : 'Classmates will appear here once they join.'
            }
          />
        ) : (
          <Card>
            <ul className="divide-y divide-border">
              {students.map((member) => (
                <MemberRow
                  key={member.userId}
                  member={member}
                  action={
                    isOwner ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Remove ${member.fullName}`}
                        onClick={() => setPendingRemoval(member)}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                        <span className="hidden sm:inline">Remove</span>
                      </Button>
                    ) : undefined
                  }
                />
              ))}
            </ul>
          </Card>
        )}
      </MemberSection>

      {data.totalPages > 1 && (
        <nav aria-label="People pages" className="flex items-center justify-between">
          <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <p className="text-meta text-muted">
            Page {data.page + 1} of {data.totalPages}
          </p>
          <Button variant="secondary" size="sm" disabled={data.last} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </nav>
      )}

      <Modal
        open={pendingRemoval !== null}
        onClose={() => setPendingRemoval(null)}
        title="Remove student"
        description={pendingRemoval ? `${pendingRemoval.fullName} will lose access to this class.` : undefined}
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setPendingRemoval(null)}>
            Cancel
          </Button>
          <Button variant="primary" loading={removeMember.isPending} onClick={() => void confirmRemoval()}>
            Remove
          </Button>
        </div>
      </Modal>
    </div>
  )
}

