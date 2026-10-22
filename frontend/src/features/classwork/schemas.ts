import { z } from 'zod'

export const topicSchema = z.object({
  name: z.string().trim().min(1, 'Topic name is required').max(160, 'Topic name must be at most 160 characters'),
})

export const assignmentSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title must be at most 200 characters'),
  instructions: z.string().trim().max(4000, 'Instructions must be at most 4000 characters'),
  // An empty string means "No topic".
  topicId: z.string(),
  maxPoints: z
    .string()
    .trim()
    .min(1, 'Max points is required')
    .refine((value) => /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 1000, {
      message: 'Enter a whole number between 1 and 1000',
    }),
  // datetime-local value, or empty for no due date.
  dueAt: z.string(),
  allowLate: z.boolean(),
})

export type TopicValues = z.infer<typeof topicSchema>
export type AssignmentValues = z.infer<typeof assignmentSchema>
