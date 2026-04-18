import z from 'zod'

export const eventBaseSchema = z.object({
  title: z.string().min(2, 'at least 2 characters'),
  description: z.string().min(5, 'at least 5 characters'),
  location: z.string().min(2, 'at least 2 characters'),
  date: z.coerce.date(),
  status: z.enum(['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED']).default('UPCOMING').optional(),
  thumbnailUrl: z.string().url().optional(),
  thumbnailPublicId: z.string().optional(),
})

export const createEventZodSchema = z.object({
  body: eventBaseSchema,
})

export const updateEventZodSchema = z.object({
  body: eventBaseSchema.partial(),
})

export const getEventParamZodSchema = z.object({
  params: z.object({
    id: z.string().uuid('must be a valid UUID'),
  }),
})

export const getAllEventQueryZodSchema = z.object({
  query: z.object({
    // filtering
    searchTerm: z.string().trim().optional(),
    location: z.string().trim().optional(),
    status: z.enum(['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED']).optional(),

    // pagination
    page: z.coerce.number().positive().optional(),
    limit: z.coerce.number().positive().max(100).optional(),

    // sorting
    sortBy: z.enum(['title', 'location', 'status', 'date', 'createdAt', 'updatedAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
})
