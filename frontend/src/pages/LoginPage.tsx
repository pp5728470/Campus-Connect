import { Link } from 'react-router-dom'
import { AuthShell } from '@/features/auth/AuthShell'
import { LoginForm } from '@/features/auth/LoginForm'

export default function LoginPage() {
  return (
    <AuthShell
      title="Sign in"
      subtitle="Use your CampusConnect account to continue."
      footer={
        <>
          New to CampusConnect?{' '}
          <Link to="/register" className="font-medium text-accent hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  )
}
