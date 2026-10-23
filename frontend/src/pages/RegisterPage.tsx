import { Link } from 'react-router-dom'
import { AuthShell } from '@/features/auth/AuthShell'
import { RegisterForm } from '@/features/auth/RegisterForm'

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create an account"
      subtitle="Join as a student or teacher and open your first notebook."
      showArt
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  )
}
