import { Loader2 } from 'lucide-react'

export function FullPageSpinner() {
  return (
    <div role="status" className="flex h-full items-center justify-center bg-bg text-muted">
      <Loader2 className="size-6 animate-spin" aria-hidden="true" />
      <span className="sr-only">Loading</span>
    </div>
  )
}
