import { useState } from 'react'
import { X } from 'lucide-react'
import { downloadFile } from '@/api/files'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/cn'
import { getErrorMessage } from '@/lib/errors'
import { fileKind, type FileKind } from '@/lib/files'
import { formatBytes } from '@/lib/format'
import type { FileResponse } from '@/types'

const typeStyles: Record<FileKind, { label: string; className: string }> = {
  pdf: { label: 'PDF', className: 'bg-danger-soft text-danger' },
  doc: { label: 'DOC', className: 'bg-accent-soft text-accent' },
  ppt: { label: 'PPT', className: 'bg-warn-soft text-warn' },
  xls: { label: 'XLS', className: 'bg-ok-soft text-ok' },
  image: { label: 'IMG', className: 'bg-ok-soft text-ok' },
  zip: { label: 'ZIP', className: 'bg-accent-soft text-accent' },
  other: { label: 'FILE', className: 'bg-surface-2 text-muted' },
}

interface FileChipProps {
  name: string
  contentType?: string | null
  sizeBytes: number
  file?: Pick<FileResponse, 'id' | 'originalName'>
  onRemove?: () => void
  disabled?: boolean
  className?: string
}

/** Compact file reference with a folded-corner type badge. */
export function FileChip({ name, contentType, sizeBytes, file, onRemove, disabled, className }: FileChipProps) {
  const toast = useToast()
  const [downloading, setDownloading] = useState(false)
  const kind = fileKind(name, contentType)
  const type = typeStyles[kind]

  const download = async () => {
    if (!file) return
    setDownloading(true)
    try {
      await downloadFile(file)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not download the file.'))
    } finally {
      setDownloading(false)
    }
  }

  const content = (
    <>
      <span className={cn('file-type-badge', type.className)} aria-hidden="true">
        {type.label}
      </span>
      <span className="min-w-0 flex-1">
        <b className="block truncate text-[13px] font-medium">{name}</b>
        <span className="block text-meta text-muted">{formatBytes(sizeBytes)}</span>
      </span>
    </>
  )

  return (
    <div className={cn('flex min-w-0 items-center gap-3 rounded-xl border border-line bg-surface py-2 pr-3 pl-2', className)}>
      {file ? (
        <button
          type="button"
          onClick={() => void download()}
          disabled={downloading}
          aria-label={`Download ${name}`}
          className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:opacity-60"
        >
          {content}
        </button>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">{content}</div>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label={`Remove ${name}`}
          className="rounded-lg p-1 text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-60"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

/** Download chips for a list of uploaded files. */
export function FileChipList({ files, className }: { files: FileResponse[]; className?: string }) {
  if (files.length === 0) return null
  return (
    <ul className={cn('grid gap-2.5 sm:grid-cols-2', className)}>
      {files.map((file) => (
        <li key={file.id} className="min-w-0">
          <FileChip name={file.originalName} contentType={file.contentType} sizeBytes={file.sizeBytes} file={file} />
        </li>
      ))}
    </ul>
  )
}
