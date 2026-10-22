import { AlertCircle } from 'lucide-react'
import { Button } from './Button'
import { EmptyState } from './EmptyState'

interface ErrorStateProps {
  title: string
  description?: string
  onRetry?: () => void
  retrying?: boolean
}

/** Shown when a request fails; offers a retry when one is available. */
export function ErrorState({
  title,
  description = 'Something went wrong while contacting the server.',
  onRetry,
  retrying,
}: ErrorStateProps) {
  return (
    <EmptyState
      icon={AlertCircle}
      title={title}
      description={description}
      action={
        onRetry && (
          <Button variant="secondary" loading={retrying} onClick={onRetry}>
            Try again
          </Button>
        )
      }
    />
  )
}
