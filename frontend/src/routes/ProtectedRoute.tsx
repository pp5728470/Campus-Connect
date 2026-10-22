import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { FullPageSpinner } from '@/components/layout/FullPageSpinner'
import { useAuth } from '@/lib/auth-context'
import type { Role } from '@/types'

interface ProtectedRouteProps {
  /** When set, only users with one of these roles may continue. */
  roles?: Role[]
}

export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <FullPageSpinner />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />

  return <Outlet />
}

/** Keeps signed-in users away from the login and register pages. */
export function PublicOnlyRoute() {
  const { user, isLoading } = useAuth()

  if (isLoading) return <FullPageSpinner />
  if (user) return <Navigate to="/" replace />

  return <Outlet />
}
