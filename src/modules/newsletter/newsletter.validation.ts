import z from 'zod'

export const newsletterBaseSchema = z.object({
  email: z.string().email('must be a valid email'),
})

export const createNewsletterZodSchema = z.object({
  body: newsletterBaseSchema,
})

export const updateNewsletterZodSchema = z.object({
  body: newsletterBaseSchema.partial(),
})

export const getNewsletterParamZodSchema = z.object({
  params: z.object({
    id: z.string().uuid('must be a valid UUID'),
  }),
})

export const getAllNewsletterQueryZodSchema = z.object({
  query: z.object({
    // filtering
    searchTerm: z.string().trim().optional(),
    email: z.string().trim().optional(),

    // pagination
    page: z.coerce.number().positive().optional(),
    limit: z.coerce.number().positive().max(100).optional(),

    // sorting
    sortBy: z.enum(['email', 'createdAt', 'updatedAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
})

export const broadcastNewsletterZodSchema = z.object({
  body: z.object({
    subject: z.string().trim().min(1, 'subject is required'),
    html: z.string().trim().min(1, 'html content is required'),
  }),
})
