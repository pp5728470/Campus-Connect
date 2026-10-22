import { Download, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { downloadFile, filesApi } from '@/api/files'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { getErrorMessage } from '@/lib/errors'
import { fileKind } from '@/lib/files'
import type { FileResponse } from '@/types'

interface FilePreviewModalProps {
  file: FileResponse | null
  onClose: () => void
}

type PreviewState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; url: string }

/** Fetches the file with the auth header and shows it from a temporary object URL. */
function PreviewBody({ file }: { file: FileResponse }) {
  const toast = useToast()
  const [state, setState] = useState<PreviewState>({ status: 'loading' })
  const kind = fileKind(file.originalName, file.contentType)

  useEffect(() => {
    let objectUrl: string | null = null
    let cancelled = false
    filesApi
      .fetchBlob(file.id)
      .then((blob) => {
        if (cancelled) return
        const type = kind === 'pdf' ? 'application/pdf' : (file.contentType ?? blob.type)
        objectUrl = URL.createObjectURL(new Blob([blob], { type }))
        setState({ status: 'ready', url: objectUrl })
      })
      .catch((error) => {
        if (cancelled) return
        const message = getErrorMessage(error, 'This file is missing on the server.')
        setState({ status: 'error', message })
        toast.error(message)
      })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
    // toast is stable enough for this effect; omit to avoid refetch loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file.id, file.contentType, file.originalName, kind])

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
        <p className="max-w-md text-body text-danger">{state.message}</p>
        <Button
          variant="secondary"
          onClick={() => {
            void downloadFile(file).catch((error) => {
              toast.error(getErrorMessage(error, 'Could not download the file.'))
            })
          }}
        >
          <Download className="size-4" aria-hidden={true} />
          Try download
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
  const toast = useToast()

  return (
    <Modal open={file !== null} onClose={onClose} title={file?.originalName ?? 'Preview'} size="lg">
      <div className="flex flex-col gap-4">
        {file && <PreviewBody key={file.id} file={file} />}
        {file && (
          <div className="flex justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                void downloadFile(file).catch((error) => {
                  toast.error(getErrorMessage(error, 'Could not download the file.'))
                })
              }}
            >
              <Download className="size-4" aria-hidden={true} />
              Download
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
