import { Search } from 'lucide-react'
import { useId } from 'react'

interface SearchFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

/** Compact search input used above admin tables. */
export function SearchField({ label, value, onChange, placeholder }: SearchFieldProps) {
  const id = useId()
  return (
    <div className="relative w-full sm:max-w-xs">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-surface py-2 pl-8 pr-3 text-body text-ink placeholder:text-muted focus-visible:border-accent focus-visible:outline-offset-0"
      />
    </div>
  )
}
