import { Link } from 'react-router-dom'
import { AuthShell } from '@/features/auth/AuthShell'
import { LoginForm } from '@/features/auth/LoginForm'

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in with your college email to open your notebooks."
      showArt
      footer={
        <>
          New here?{' '}
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
