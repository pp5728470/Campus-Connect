import { Download, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { downloadFile, filesApi } from '@/api/files'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { fileKind } from '@/lib/files'
import type { FileResponse } from '@/types'

interface FilePreviewModalProps {
  file: FileResponse | null
  onClose: () => void
}

type PreviewState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; url: string }

/** Fetches the file with the auth header and shows it from a temporary object URL. */
function PreviewBody({ file }: { file: FileResponse }) {
  const [state, setState] = useState<PreviewState>({ status: 'loading' })
  const kind = fileKind(file.originalName, file.contentType)

  useEffect(() => {
    let objectUrl: string | null = null
    let cancelled = false
    filesApi
      .fetchBlob(file.id)
      .then((blob) => {
        if (cancelled) return
        // Make sure the browser renders the blob as the type we expect.
        const type = kind === 'pdf' ? 'application/pdf' : (file.contentType ?? blob.type)
        objectUrl = URL.createObjectURL(new Blob([blob], { type }))
        setState({ status: 'ready', url: objectUrl })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [file, kind])

  if (state.status === 'loading') {
    return (
      <div role="status" className="flex h-64 items-center justify-center gap-2 text-body text-muted">
        <Loader2 className="size-4 animate-spin" aria-hidden={true} />
        Loading preview
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div role="alert" className="flex h-64 flex-col items-center justify-center gap-3 text-center">
        <p className="text-body text-danger">The preview could not be loaded.</p>
        <Button variant="secondary" onClick={() => void downloadFile(file)}>
          <Download className="size-4" aria-hidden={true} />
          Download instead
        </Button>
      </div>
    )
  }

  if (kind === 'image') {
    return (
      <div className="flex justify-center">
        <img src={state.url} alt={file.originalName} className="max-h-[70vh] max-w-full rounded-lg object-contain" />
      </div>
    )
  }

  return <iframe src={state.url} title={file.originalName} className="h-[70vh] w-full rounded-lg border border-border" />
}

export function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
  return (
    <Modal open={file !== null} onClose={onClose} title={file?.originalName ?? 'Preview'} size="lg">
      <div className="flex flex-col gap-4">
        {file && <PreviewBody key={file.id} file={file} />}
        {file && (
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => void downloadFile(file)}>
              <Download className="size-4" aria-hidden={true} />
              Download
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
