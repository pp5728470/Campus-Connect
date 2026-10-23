import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import AdminPage from '@/pages/AdminPage'
import AssignmentDetailPage from '@/pages/AssignmentDetailPage'
import CalendarPage from '@/pages/CalendarPage'
import ClassPage from '@/pages/ClassPage'
import DashboardPage from '@/pages/DashboardPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import LoginPage from '@/pages/LoginPage'
import NotificationsPage from '@/pages/NotificationsPage'
import ProfilePage from '@/pages/ProfilePage'
import RegisterPage from '@/pages/RegisterPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import TodoPage from '@/pages/TodoPage'
import { ProtectedRoute, PublicOnlyRoute } from './ProtectedRoute'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* Reachable whether or not the user is signed in, since the link comes from an email. */}
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/todo" element={<TodoPage />} />
          <Route path="/classes/:classId/assignments/:assignmentId" element={<AssignmentDetailPage />} />
          <Route path="/classes/:id/:tab?" element={<ClassPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['ADMIN']} />}>
        <Route element={<AppLayout />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
