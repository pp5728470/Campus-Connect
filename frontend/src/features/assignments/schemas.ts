import { z } from 'zod'

/** Grading form; the grade is kept as text in the input and checked against the assignment's max points. */
export function gradeSchema(maxPoints: number) {
  return z.object({
    grade: z
      .string()
      .trim()
      .min(1, 'Enter a mark')
      .refine((value) => /^\d+(\.\d{1,2})?$/.test(value), { message: 'Enter a number with up to two decimals' })
      .refine((value) => Number(value) <= maxPoints, { message: `Marks cannot exceed ${maxPoints}` }),
    feedback: z.string().trim().max(2000, 'Feedback must be at most 2000 characters'),
    returnWork: z.boolean(),
  })
}

export type GradeValues = z.infer<ReturnType<typeof gradeSchema>>
