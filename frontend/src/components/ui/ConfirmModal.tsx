import { Button } from './Button'
import { Modal } from './Modal'

interface ConfirmModalProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
}

/** Confirmation dialog for destructive actions. */
export function ConfirmModal({ open, title, description, confirmLabel, loading, onConfirm, onClose }: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={description}>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button loading={loading} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
