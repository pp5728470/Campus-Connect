import { Link, useSearchParams } from 'react-router-dom'
import { AuthShell } from '@/features/auth/AuthShell'
import { ResetPasswordForm } from '@/features/auth/ResetPasswordForm'

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token')

  return (
    <AuthShell
      title="Reset password"
      subtitle="Choose a new password for your account."
      footer={
        <Link to="/login" className="font-medium text-accent hover:underline">
          Back to sign in
        </Link>
      }
    >
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <p role="alert" className="rounded-lg border border-border px-3 py-2 text-body text-danger">
          This reset link is incomplete. Request a new one from the{' '}
          <Link to="/forgot-password" className="font-medium text-accent hover:underline">
            forgot password
          </Link>{' '}
          page.
        </p>
      )}
    </AuthShell>
  )
}
