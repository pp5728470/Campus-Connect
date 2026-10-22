import { Button } from './Button'

interface PaginationProps {
  label: string
  /** Zero-based current page. */
  page: number
  totalPages: number
  onChange: (page: number) => void
}

/** Previous / next controls for paged lists; renders nothing for a single page. */
export function Pagination({ label, page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null
  return (
    <nav aria-label={label} className="flex items-center justify-between">
      <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => onChange(page - 1)}>
        Previous
      </Button>
      <p className="text-meta text-muted">
        Page {page + 1} of {totalPages}
      </p>
      <Button variant="secondary" size="sm" disabled={page + 1 >= totalPages} onClick={() => onChange(page + 1)}>
        Next
      </Button>
    </nav>
  )
}
