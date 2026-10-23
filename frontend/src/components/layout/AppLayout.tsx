import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { CommandPalette } from '@/features/search/CommandPalette'
import { MobileBottomNav } from './MobileBottomNav'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

const DESKTOP_QUERY = '(min-width: 1024px)'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.matchMedia(DESKTOP_QUERY).matches)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

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
      <TopBar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((open) => !open)}
        onOpenSearch={() => setSearchOpen(true)}
      />
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      <div className="relative flex min-h-0 flex-1">
        <Sidebar open={sidebarOpen} onNavigate={closeOnMobile} />
        <main id="main" className="app-main-pad min-w-0 flex-1 overflow-y-auto bg-bg">
          <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8 lg:px-10">
            <Outlet />
          </div>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  )
}
