import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { authApi } from '@/api/auth'
import { getErrorMessage } from '@/lib/errors'
import { forgotPasswordSchema, type ForgotPasswordValues } from './schemas'

export function ForgotPasswordForm() {
  const [formError, setFormError] = useState<string | null>(null)
  const [sentMessage, setSentMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: '' } })

  const onSubmit = handleSubmit(async ({ email }) => {
    setFormError(null)
    try {
      const response = await authApi.forgotPassword(email)
      setSentMessage(response.message)
    } catch (error) {
      setFormError(getErrorMessage(error))
    }
  })

  if (sentMessage) {
    return (
      <p role="status" className="rounded-lg border border-border px-3 py-2 text-body text-success">
        {sentMessage}
      </p>
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
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="name@college.edu"
        error={errors.email?.message}
        {...register('email')}
      />
      <Button type="submit" loading={isSubmitting}>
        Send reset link
      </Button>
    </form>
  )
}
