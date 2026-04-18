import z from 'zod'

const currentYear = new Date().getFullYear()

export const yearQueryZodSchema = z.object({
  query: z.object({
    year: z.coerce
      .number()
      .int()
      .min(2000)
      .max(currentYear + 1)
      .optional(),
  }),
})

export const recentActivityQueryZodSchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().positive().max(50).optional(),
  }),
})
