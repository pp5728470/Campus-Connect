import { File, FileArchive, FileImage, FileSpreadsheet, FileText, Presentation, X } from 'lucide-react'
import { useState } from 'react'
import { downloadFile } from '@/api/files'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/cn'
import { getErrorMessage } from '@/lib/errors'
import { fileKind, type FileKind } from '@/lib/files'
import { formatBytes } from '@/lib/format'
import type { FileResponse } from '@/types'

const icons: Record<FileKind, typeof File> = {
  pdf: FileText,
  doc: FileText,
  ppt: Presentation,
  xls: FileSpreadsheet,
  image: FileImage,
  zip: FileArchive,
  other: File,
}

interface FileChipProps {
  name: string
  contentType?: string | null
  sizeBytes: number
  /** Renders the chip as a download button for an uploaded file. */
  file?: Pick<FileResponse, 'id' | 'originalName'>
  /** Shows a remove button, used for files that are not saved yet. */
  onRemove?: () => void
  disabled?: boolean
  className?: string
}

/** Compact file reference with a type icon. Clicking an uploaded file downloads it. */
export function FileChip({ name, contentType, sizeBytes, file, onRemove, disabled, className }: FileChipProps) {
  const toast = useToast()
  const [downloading, setDownloading] = useState(false)
  const Icon = icons[fileKind(name, contentType)]

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
      <Icon className="size-4 shrink-0 text-accent" aria-hidden={true} />
      <span className="min-w-0 flex-1 truncate text-body font-medium">{name}</span>
      <span className="shrink-0 text-meta text-muted">{formatBytes(sizeBytes)}</span>
    </>
  )

  return (
    <div className={cn('flex items-center rounded-lg border border-border bg-surface', className)}>
      {file ? (
        <button
          type="button"
          onClick={() => void download()}
          disabled={downloading}
          aria-label={`Download ${name}`}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-hover disabled:opacity-60"
        >
          {content}
        </button>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2">{content}</div>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label={`Remove ${name}`}
          className="mr-1 rounded-lg p-1 text-muted hover:bg-hover hover:text-ink disabled:opacity-60"
        >
          <X className="size-4" aria-hidden={true} />
        </button>
      )}
    </div>
  )
}

/** Download chips for a list of uploaded files. */
export function FileChipList({ files, className }: { files: FileResponse[]; className?: string }) {
  if (files.length === 0) return null
  return (
    <ul className={cn('grid gap-2 sm:grid-cols-2', className)}>
      {files.map((file) => (
        <li key={file.id} className="min-w-0">
          <FileChip name={file.originalName} contentType={file.contentType} sizeBytes={file.sizeBytes} file={file} />
        </li>
      ))}
    </ul>
  )
}
