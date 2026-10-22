import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(1, 'Full name is required').max(120, 'Full name must be at most 120 characters'),
    email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address').max(180),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password must be at most 72 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
    role: z.enum(['STUDENT', 'TEACHER']),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })

const newPasswordField = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
})

export const resetPasswordSchema = z
  .object({
    newPassword: newPasswordField,
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: newPasswordField,
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    path: ['newPassword'],
    message: 'New password must be different from the current one',
  })

export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>
