import { z } from 'zod'
import { COVER_IDS, DEFAULT_COVER } from '@/lib/covers'

export { COVER_IDS, DEFAULT_COVER, COVER_IDS as BANNER_COLORS }

export const createClassSchema = z.object({
  name: z.string().trim().min(1, 'Class name is required').max(120, 'Class name must be at most 120 characters'),
  section: z.string().trim().max(60, 'Section must be at most 60 characters'),
  subject: z.string().trim().max(120, 'Subject must be at most 120 characters'),
  room: z.string().trim().max(60, 'Room must be at most 60 characters'),
  description: z.string().trim().max(1000, 'Description must be at most 1000 characters'),
  bannerColor: z.enum(COVER_IDS, { message: 'Choose one of the six notebook covers' }),
})

export const joinClassSchema = z.object({
  classCode: z
    .string()
    .trim()
    .length(7, 'Class code is 7 characters long')
    .regex(/^[A-Za-z0-9]+$/, 'Class code can only contain letters and numbers'),
})

export type CreateClassValues = z.infer<typeof createClassSchema>
export type JoinClassValues = z.infer<typeof joinClassSchema>
