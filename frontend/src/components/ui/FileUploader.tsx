import { Upload } from 'lucide-react'
import { useId, useState, type ChangeEvent, type DragEvent } from 'react'
import { cn } from '@/lib/cn'
import { MAX_UPLOAD_BYTES } from '@/lib/files'
import { formatBytes } from '@/lib/format'
import type { FileResponse } from '@/types'
import { FileChip } from './FileChip'

interface FileUploaderProps {
  label: string
  /** Files chosen but not uploaded yet; the parent uploads them on submit. */
  files: File[]
  onChange: (files: File[]) => void
  /** Already uploaded files (for example when editing) that can be dropped from the form. */
  existing?: FileResponse[]
  onRemoveExisting?: (file: FileResponse) => void
  /** Upload progress, 0-100, or null when idle. */
  progress?: number | null
  disabled?: boolean
  multiple?: boolean
  error?: string
}

/** Drag-and-drop file picker with a selected files list and upload progress bar. */
export function FileUploader({
  label,
  files,
  onChange,
  existing = [],
  onRemoveExisting,
  progress = null,
  disabled = false,
  multiple = true,
  error,
}: FileUploaderProps) {
  const inputId = useId()
  const [dragging, setDragging] = useState(false)
  const [rejected, setRejected] = useState<string | null>(null)
  const uploading = progress !== null

  const addFiles = (incoming: File[]) => {
    const accepted = incoming.filter((file) => file.size <= MAX_UPLOAD_BYTES)
    const tooLarge = incoming.length - accepted.length
    setRejected(
      tooLarge > 0 ? `${tooLarge} file${tooLarge > 1 ? 's' : ''} skipped. Files must be ${formatBytes(MAX_UPLOAD_BYTES)} or smaller.` : null,
    )
    onChange(multiple ? [...files, ...accepted] : accepted.slice(0, 1))
  }

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(event.target.files ?? []))
    // Allow selecting the same file again after removing it.
    event.target.value = ''
  }

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setDragging(false)
    if (disabled || uploading) return
    addFiles(Array.from(event.dataTransfer.files))
  }

  const message = error ?? rejected

  return (
    <div className="flex flex-col gap-2">
      <span className="text-meta font-medium text-ink">{label}</span>

      <label
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled && !uploading) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-dashed px-4 py-6 text-center',
          'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
          dragging ? 'border-accent bg-accent-soft' : 'border-border bg-surface hover:bg-hover',
          (disabled || uploading) && 'cursor-not-allowed opacity-60',
        )}
      >
        <Upload className="size-4 text-muted" aria-hidden={true} />
        <span className="text-body">
          <span className="font-medium text-accent">Choose {multiple ? 'files' : 'a file'}</span> or drag them here
        </span>
        <span className="text-meta text-muted">Up to {formatBytes(MAX_UPLOAD_BYTES)} each</span>
        <input
          id={inputId}
          type="file"
          multiple={multiple}
          disabled={disabled || uploading}
          onChange={onInputChange}
          className="sr-only"
        />
      </label>

      {message && (
        <p role="alert" className="text-meta text-danger">
          {message}
        </p>
      )}

      {(existing.length > 0 || files.length > 0) && (
        <ul className="flex flex-col gap-2">
          {existing.map((file) => (
            <li key={`saved-${file.id}`}>
              <FileChip
                name={file.originalName}
                contentType={file.contentType}
                sizeBytes={file.sizeBytes}
                file={file}
                onRemove={onRemoveExisting ? () => onRemoveExisting(file) : undefined}
                disabled={uploading}
              />
            </li>
          ))}
          {files.map((file, index) => (
            <li key={`${file.name}-${file.lastModified}-${index}`}>
              <FileChip
                name={file.name}
                contentType={file.type}
                sizeBytes={file.size}
                onRemove={() => onChange(files.filter((_, i) => i !== index))}
                disabled={uploading}
              />
            </li>
          ))}
        </ul>
      )}

      {uploading && (
        <div className="flex flex-col gap-1">
          <div
            role="progressbar"
            aria-label="Upload progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            className="h-2 overflow-hidden rounded-lg bg-border"
          >
            <div className="h-full bg-accent transition-[width]" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-meta text-muted">Uploading {progress}%</p>
        </div>
      )}
    </div>
  )
}
