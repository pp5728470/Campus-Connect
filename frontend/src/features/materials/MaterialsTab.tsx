import { Ellipsis, Eye, FolderOpen, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { Dropdown } from '@/components/ui/Dropdown'
import { EmptyState } from '@/components/ui/EmptyState'
import { FileChip } from '@/components/ui/FileChip'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { useDeleteMaterial, useMaterials } from '@/hooks/use-materials'
import { useTopics } from '@/hooks/use-topics'
import { getErrorMessage } from '@/lib/errors'
import { isPreviewable } from '@/lib/files'
import { timeAgo } from '@/lib/format'
import type { Classroom, FileResponse, Material, Topic } from '@/types'
import { FilePreviewModal } from './FilePreviewModal'
import { MaterialModal } from './MaterialModal'

interface MaterialCardProps {
  material: Material
  isTeacher: boolean
  onPreview: (file: FileResponse) => void
  onDelete: () => void
}

function MaterialCard({ material, isTeacher, onPreview, onDelete }: MaterialCardProps) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-body font-semibold">{material.title}</h3>
          <p className="text-meta text-muted">
            {material.createdByName} &middot; {timeAgo(material.createdAt)}
          </p>
        </div>
        {isTeacher && (
          <Dropdown
            label={`Actions for ${material.title}`}
            trigger={<Ellipsis className="size-6 p-1 text-muted" aria-hidden={true} />}
            items={[{ label: 'Delete', icon: Trash2, danger: true, onSelect: onDelete }]}
          />
        )}
      </div>
      {material.description && <p className="whitespace-pre-wrap break-words text-body">{material.description}</p>}
      {material.files.length > 0 && (
        <ul className="flex flex-col gap-2">
          {material.files.map((file) => (
            <li key={file.id} className="flex items-center gap-2">
              <FileChip
                className="min-w-0 flex-1"
                name={file.originalName}
                contentType={file.contentType}
                sizeBytes={file.sizeBytes}
                file={file}
              />
              {isPreviewable(file) && (
                <Button variant="secondary" size="sm" aria-label={`Preview ${file.originalName}`} onClick={() => onPreview(file)}>
                  <Eye className="size-4" aria-hidden={true} />
                  <span className="hidden sm:inline">Preview</span>
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

interface Group {
  key: string
  topic: Topic | null
  materials: Material[]
}

function MaterialsSkeleton() {
  return (
    <div role="status" aria-label="Loading materials" className="flex flex-col gap-4">
      {[0, 1].map((i) => (
        <Card key={i} className="flex flex-col gap-3 p-4">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-8 w-full" />
        </Card>
      ))}
    </div>
  )
}

export function MaterialsTab({ classroom }: { classroom: Classroom }) {
  const toast = useToast()
  const isTeacher = classroom.myRole === 'TEACHER'
  const canEdit = isTeacher && !classroom.archived
  const materialsQuery = useMaterials(classroom.id)
  const topicsQuery = useTopics(classroom.id)
  const deleteMaterial = useDeleteMaterial(classroom.id)

  const [uploadOpen, setUploadOpen] = useState(false)
  const [preview, setPreview] = useState<FileResponse | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Material | null>(null)

  const topics = useMemo(
    () => [...(topicsQuery.data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [topicsQuery.data],
  )
  const materials = materialsQuery.data?.content

  const groups = useMemo<Group[]>(() => {
    if (!materials) return []
    const result: Group[] = []
    const loose = materials.filter((m) => m.topicId === null)
    if (loose.length > 0) result.push({ key: 'none', topic: null, materials: loose })
    for (const topic of topics) {
      const items = materials.filter((m) => m.topicId === topic.id)
      if (items.length > 0) result.push({ key: String(topic.id), topic, materials: items })
    }
    return result
  }, [materials, topics])

  const isLoading = materialsQuery.isLoading || topicsQuery.isLoading
  const isError = materialsQuery.isError || topicsQuery.isError
  const showNoTopicHeading = groups.some((group) => group.topic !== null)

  const confirmDelete = async () => {
    if (!pendingDelete) return
    try {
      await deleteMaterial.mutateAsync(pendingDelete.id)
      toast.success('Material deleted')
      setPendingDelete(null)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {canEdit && (
        <div>
          <Button onClick={() => setUploadOpen(true)}>
            <Plus className="size-4" aria-hidden={true} />
            Add material
          </Button>
        </div>
      )}

      {isLoading && <MaterialsSkeleton />}

      {isError && (
        <EmptyState
          title="Could not load materials"
          description="Something went wrong while contacting the server."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                void materialsQuery.refetch()
                void topicsQuery.refetch()
              }}
            >
              Try again
            </Button>
          }
        />
      )}

      {!isLoading && !isError && groups.length === 0 && (
        <EmptyState
          icon={FolderOpen}
          title="No materials yet"
          description={
            isTeacher
              ? 'Add notes, slides or reference files for your students.'
              : 'Notes and reference files shared by your teacher will appear here.'
          }
        />
      )}

      {groups.map((group) => (
        <section key={group.key} aria-label={group.topic?.name ?? 'No topic'} className="flex flex-col gap-3">
          {(group.topic || showNoTopicHeading) && (
            <h2 className="border-b border-border pb-2 text-section font-semibold">{group.topic?.name ?? 'No topic'}</h2>
          )}
          {group.materials.map((material) => (
            <MaterialCard
              key={material.id}
              material={material}
              isTeacher={isTeacher}
              onPreview={setPreview}
              onDelete={() => setPendingDelete(material)}
            />
          ))}
        </section>
      ))}

      <MaterialModal open={uploadOpen} classId={classroom.id} topics={topics} onClose={() => setUploadOpen(false)} />
      <FilePreviewModal file={preview} onClose={() => setPreview(null)} />
      <ConfirmModal
        open={pendingDelete !== null}
        title="Delete material"
        description={pendingDelete ? `"${pendingDelete.title}" will be removed for everyone in the class.` : ''}
        confirmLabel="Delete"
        loading={deleteMaterial.isPending}
        onConfirm={() => void confirmDelete()}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  )
}
