import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { authApi } from '@/api/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { getErrorMessage } from '@/lib/errors'
import { resetPasswordSchema, type ResetPasswordValues } from './schemas'

export function ResetPasswordForm({ token }: { token: string }) {
  const [formError, setFormError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  const onSubmit = handleSubmit(async ({ newPassword }) => {
    setFormError(null)
    try {
      await authApi.resetPassword(token, newPassword)
      setDone(true)
    } catch (error) {
      setFormError(getErrorMessage(error))
    }
  })

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <p role="status" className="rounded-lg border border-border px-3 py-2 text-body text-success">
          Your password has been reset. You can sign in with the new password.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center justify-center rounded-lg border border-accent bg-accent px-4 py-2 text-body font-medium text-white hover:bg-accent-hover"
        >
          Go to sign in
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {formError && (
        <p role="alert" className="rounded-lg border border-border px-3 py-2 text-body text-danger">
          {formError}
        </p>
      )}
      <Input
        label="New password"
        type="password"
        autoComplete="new-password"
        hint="8 to 72 characters"
        error={errors.newPassword?.message}
        {...register('newPassword')}
      />
      <Input
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      <Button type="submit" loading={isSubmitting}>
        Reset password
      </Button>
    </form>
  )
}
