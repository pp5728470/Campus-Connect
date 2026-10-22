import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/lib/auth-context'
import { getErrorMessage } from '@/lib/errors'
import { changePasswordSchema, type ChangePasswordValues } from './schemas'

/** Profile page card for changing the password; other devices are signed out by the server. */
export function ChangePasswordForm() {
  const { changePassword } = useAuth()
  const toast = useToast()

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const onSubmit = handleSubmit(async ({ currentPassword, newPassword }) => {
    try {
      await changePassword(currentPassword, newPassword)
      toast.success('Password changed')
      reset()
    } catch (error) {
      setError('root', { message: getErrorMessage(error) })
    }
  })

  return (
    <Card className="max-w-2xl">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4 p-6" aria-labelledby="change-password-heading">
        <div>
          <h2 id="change-password-heading" className="text-section font-semibold">
            Change password
          </h2>
          <p className="text-body text-muted">You will stay signed in here; other devices are signed out.</p>
        </div>
        {errors.root?.message && (
          <p role="alert" className="rounded-lg border border-border px-3 py-2 text-body text-danger">
            {errors.root.message}
          </p>
        )}
        <Input
          label="Current password"
          type="password"
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          {...register('currentPassword')}
        />
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
        <div>
          <Button type="submit" loading={isSubmitting}>
            Update password
          </Button>
        </div>
      </form>
    </Card>
  )
}
