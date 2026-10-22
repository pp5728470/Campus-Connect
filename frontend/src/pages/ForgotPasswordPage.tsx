import { Link } from 'react-router-dom'
import { AuthShell } from '@/features/auth/AuthShell'
import { ForgotPasswordForm } from '@/features/auth/ForgotPasswordForm'

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot password"
      subtitle="Enter your email and we will send you a link to reset your password."
      footer={
        <Link to="/login" className="font-medium text-accent hover:underline">
          Back to sign in
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  )
}
