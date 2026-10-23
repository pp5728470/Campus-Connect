import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/cn'
import { getErrorMessage } from '@/lib/errors'
import { registerSchema, type RegisterValues } from './schemas'

const roleOptions = [
  { value: 'STUDENT', label: 'Student', description: 'Join classes with a code' },
  { value: 'TEACHER', label: 'Teacher', description: 'Create and manage classes' },
] as const

export function RegisterForm() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '', role: 'STUDENT' },
  })
  const selectedRole = watch('role')

  const onSubmit = handleSubmit(async ({ confirmPassword: _confirm, ...payload }) => {
    setFormError(null)
    try {
      await registerUser(payload)
      navigate('/', { replace: true })
    } catch (error) {
      setFormError(getErrorMessage(error))
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {formError && (
        <p role="alert" className="rounded-lg border border-border px-3 py-2 text-body text-danger">
          {formError}
        </p>
      )}

      <fieldset className="flex flex-col gap-1">
        <legend className="mb-2 text-meta font-medium">I am a</legend>
        <div className="grid grid-cols-2 gap-3">
          {roleOptions.map((option) => (
            <label
              key={option.value}
              className={cn(
                'flex cursor-pointer flex-col gap-1.5 rounded-xl border p-4 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
                selectedRole === option.value
                  ? 'border-accent bg-accent-soft shadow-[inset_0_0_0_1px_var(--accent)]'
                  : 'border-border bg-surface hover:bg-hover',
              )}
            >
              <input type="radio" value={option.value} className="sr-only" {...register('role')} />
              <span className="text-body font-semibold">{option.label}</span>
              <span className="text-meta text-muted">{option.description}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <Input
        label="Full name"
        autoComplete="name"
        placeholder="Ananya Sharma"
        error={errors.fullName?.message}
        {...register('fullName')}
      />
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="name@college.edu"
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        label="Password"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters"
        error={errors.password?.message}
        {...register('password')}
      />
      <Input
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      <Button type="submit" loading={isSubmitting}>
        Create account
      </Button>
    </form>
  )
}
