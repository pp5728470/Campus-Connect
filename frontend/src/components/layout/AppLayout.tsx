import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

const DESKTOP_QUERY = '(min-width: 1024px)'

export function AppLayout() {
  // Open by default on desktop, closed on smaller screens.
  const [sidebarOpen, setSidebarOpen] = useState(() => window.matchMedia(DESKTOP_QUERY).matches)

  const closeOnMobile = () => {
    if (!window.matchMedia(DESKTOP_QUERY).matches) setSidebarOpen(false)
  }

  return (
    <div className="flex h-full flex-col">
      <a
        href="#main"
        className="sr-only rounded-lg bg-surface px-4 py-2 focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
      >
        Skip to content
      </a>
      <TopBar sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((open) => !open)} />
      <div className="relative flex min-h-0 flex-1">
        <Sidebar open={sidebarOpen} onNavigate={closeOnMobile} />
        {/* Dimmed backdrop behind the mobile drawer */}
        <div
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
          className={cn('fixed inset-0 top-14 z-10 bg-black/40 lg:hidden', sidebarOpen ? 'block' : 'hidden')}
        />
        <main id="main" className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
