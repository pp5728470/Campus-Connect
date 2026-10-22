import { GraduationCap } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card } from '@/components/ui/Card'

interface AuthShellProps {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

/** Centered card used by the login and register pages. */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <main className="flex min-h-full items-center justify-center bg-bg p-4">
      <div className="flex w-full max-w-md flex-col gap-4">
        <div className="flex items-center justify-center gap-2 text-section font-semibold">
          <GraduationCap className="size-6 text-accent" aria-hidden="true" />
          CampusConnect
        </div>
        <Card className="flex flex-col gap-6 p-6">
          <div>
            <h1 className="text-title font-semibold">{title}</h1>
            <p className="mt-1 text-body text-muted">{subtitle}</p>
          </div>
          {children}
        </Card>
        <p className="text-center text-body text-muted">{footer}</p>
      </div>
    </main>
  )
}
