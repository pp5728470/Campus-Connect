import { ClipboardList, Ellipsis, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { Dropdown } from '@/components/ui/Dropdown'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/Toast'
import { useAssignments, useDeleteAssignment } from '@/hooks/use-assignments'
import { useDeleteTopic, useTopics } from '@/hooks/use-topics'
import { cn } from '@/lib/cn'
import { getErrorMessage } from '@/lib/errors'
import { dueLabel } from '@/lib/format'
import type { Assignment, Classroom, Topic } from '@/types'
import { AssignmentModal } from './AssignmentModal'
import { TopicModal } from './TopicModal'

const DAY_MS = 24 * 60 * 60 * 1000

/** Color for the due label: red when missing, amber when due within two days. */
function dueTone(assignment: Assignment): string {
  if (assignment.mySubmissionStatus === 'MISSING') return 'text-danger'
  if (assignment.mySubmissionStatus === 'ASSIGNED' && assignment.dueAt) {
    const remaining = new Date(assignment.dueAt).getTime() - Date.now()
    if (remaining >= 0 && remaining < 2 * DAY_MS) return 'text-warning'
  }
  return 'text-muted'
}

interface AssignmentRowProps {
  assignment: Assignment
  isTeacher: boolean
  onEdit: () => void
  onDelete: () => void
}

function AssignmentRow({ assignment, isTeacher, onEdit, onDelete }: AssignmentRowProps) {
  return (
    <li className="flex items-center gap-2 first:rounded-t-lg last:rounded-b-lg hover:bg-hover">
      <Link
        to={`/classes/${assignment.classroomId}/assignments/${assignment.id}`}
        className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3"
      >
        <ClipboardList className="size-4 shrink-0 text-accent" aria-hidden={true} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-body font-medium">{assignment.title}</p>
          <p className="text-meta text-muted">
            <span className={cn('font-medium', dueTone(assignment))}>{dueLabel(assignment.dueAt)}</span>
            {' \u00B7 '}
            {assignment.maxPoints} points
          </p>
        </div>
        {!isTeacher && assignment.mySubmissionStatus && <StatusBadge status={assignment.mySubmissionStatus} />}
      </Link>
      {isTeacher && (
        <div className="pr-2">
          <Dropdown
            label={`Actions for ${assignment.title}`}
            trigger={<Ellipsis className="size-6 p-1 text-muted" aria-hidden={true} />}
            items={[
              { label: 'Edit', icon: Pencil, onSelect: onEdit },
              { label: 'Delete', icon: Trash2, danger: true, onSelect: onDelete },
            ]}
          />
        </div>
      )}
    </li>
  )
}

interface Group {
  key: string
  topic: Topic | null
  assignments: Assignment[]
}

function ClassworkSkeleton() {
  return (
    <div role="status" aria-label="Loading classwork" className="flex flex-col gap-6">
      {[0, 1].map((i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-6 w-1/4" />
          <Card className="flex flex-col gap-3 p-4">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </Card>
        </div>
      ))}
    </div>
  )
}

export function ClassworkTab({ classroom }: { classroom: Classroom }) {
  const toast = useToast()
  const isTeacher = classroom.myRole === 'TEACHER'
  const canEdit = isTeacher && !classroom.archived
  const topicsQuery = useTopics(classroom.id)
  const assignmentsQuery = useAssignments(classroom.id)
  const deleteAssignment = useDeleteAssignment(classroom.id)
  const deleteTopic = useDeleteTopic(classroom.id)

  const [topicModal, setTopicModal] = useState<{ open: boolean; topic: Topic | null }>({ open: false, topic: null })
  const [assignmentModal, setAssignmentModal] = useState<{ open: boolean; assignment: Assignment | null }>({
    open: false,
    assignment: null,
  })
  const [pendingAssignmentDelete, setPendingAssignmentDelete] = useState<Assignment | null>(null)
  const [pendingTopicDelete, setPendingTopicDelete] = useState<Topic | null>(null)

  const topics = useMemo(
    () => [...(topicsQuery.data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [topicsQuery.data],
  )
  const assignments = assignmentsQuery.data?.content

  // "No topic" first, then each topic in order. Teachers also see empty topics.
  const groups = useMemo<Group[]>(() => {
    if (!assignments) return []
    const loose = assignments.filter((a) => a.topicId === null)
    const result: Group[] = []
    if (loose.length > 0) result.push({ key: 'none', topic: null, assignments: loose })
    for (const topic of topics) {
      const items = assignments.filter((a) => a.topicId === topic.id)
      if (items.length > 0 || canEdit) result.push({ key: String(topic.id), topic, assignments: items })
    }
    return result
  }, [assignments, topics, canEdit])

  const isLoading = topicsQuery.isLoading || assignmentsQuery.isLoading
  const isError = topicsQuery.isError || assignmentsQuery.isError
  const showNoTopicHeading = groups.some((group) => group.topic !== null)

  const confirmDeleteAssignment = async () => {
    if (!pendingAssignmentDelete) return
    try {
      await deleteAssignment.mutateAsync(pendingAssignmentDelete.id)
      toast.success('Assignment deleted')
      setPendingAssignmentDelete(null)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const confirmDeleteTopic = async () => {
    if (!pendingTopicDelete) return
    try {
      await deleteTopic.mutateAsync(pendingTopicDelete.id)
      toast.success('Topic deleted')
      setPendingTopicDelete(null)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {canEdit && (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setAssignmentModal({ open: true, assignment: null })}>
            <Plus className="size-4" aria-hidden={true} />
            Create assignment
          </Button>
          <Button variant="secondary" onClick={() => setTopicModal({ open: true, topic: null })}>
            <Plus className="size-4" aria-hidden={true} />
            Create topic
          </Button>
        </div>
      )}

      {isLoading && <ClassworkSkeleton />}

      {isError && (
        <EmptyState
          title="Could not load classwork"
          description="Something went wrong while contacting the server."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                void topicsQuery.refetch()
                void assignmentsQuery.refetch()
              }}
            >
              Try again
            </Button>
          }
        />
      )}

      {!isLoading && !isError && groups.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          title="No classwork yet"
          description={
            isTeacher
              ? 'Create an assignment to give your students something to work on.'
              : 'Assignments from your teacher will appear here.'
          }
        />
      )}

      {groups.map((group) => (
        <section key={group.key} aria-label={group.topic?.name ?? 'No topic'} className="flex flex-col gap-2">
          {(group.topic || showNoTopicHeading) && (
            <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
              <h2 className="text-section font-semibold">{group.topic?.name ?? 'No topic'}</h2>
              {group.topic && canEdit && (
                <Dropdown
                  label={`Actions for topic ${group.topic.name}`}
                  trigger={<Ellipsis className="size-6 p-1 text-muted" aria-hidden={true} />}
                  items={[
                    { label: 'Rename', icon: Pencil, onSelect: () => setTopicModal({ open: true, topic: group.topic }) },
                    { label: 'Delete', icon: Trash2, danger: true, onSelect: () => setPendingTopicDelete(group.topic) },
                  ]}
                />
              )}
            </div>
          )}
          {group.assignments.length === 0 ? (
            <p className="text-body text-muted">No assignments in this topic yet.</p>
          ) : (
            <Card>
              <ul className="divide-y divide-border">
                {group.assignments.map((assignment) => (
                  <AssignmentRow
                    key={assignment.id}
                    assignment={assignment}
                    isTeacher={isTeacher}
                    onEdit={() => setAssignmentModal({ open: true, assignment })}
                    onDelete={() => setPendingAssignmentDelete(assignment)}
                  />
                ))}
              </ul>
            </Card>
          )}
        </section>
      ))}

      <TopicModal
        open={topicModal.open}
        classId={classroom.id}
        topic={topicModal.topic}
        onClose={() => setTopicModal((current) => ({ ...current, open: false }))}
      />
      <AssignmentModal
        open={assignmentModal.open}
        classId={classroom.id}
        topics={topics}
        assignment={assignmentModal.assignment}
        onClose={() => setAssignmentModal((current) => ({ ...current, open: false }))}
      />
      <ConfirmModal
        open={pendingAssignmentDelete !== null}
        title="Delete assignment"
        description={
          pendingAssignmentDelete
            ? `"${pendingAssignmentDelete.title}" and all student submissions will be removed.`
            : ''
        }
        confirmLabel="Delete"
        loading={deleteAssignment.isPending}
        onConfirm={() => void confirmDeleteAssignment()}
        onClose={() => setPendingAssignmentDelete(null)}
      />
      <ConfirmModal
        open={pendingTopicDelete !== null}
        title="Delete topic"
        description={
          pendingTopicDelete
            ? `"${pendingTopicDelete.name}" will be removed. Its assignments and materials move to No topic.`
            : ''
        }
        confirmLabel="Delete"
        loading={deleteTopic.isPending}
        onConfirm={() => void confirmDeleteTopic()}
        onClose={() => setPendingTopicDelete(null)}
      />
    </div>
  )
}
