import z from 'zod'

export const offerBaseSchema = z.object({
  title: z.string().min(2, 'at least 2 characters'),
  description: z.string().min(5, 'at least 5 characters'),
  discount: z.coerce.number().min(0, 'must be non-negative').max(100, 'must be at most 100'),
  validUntil: z.coerce.date(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE').optional(),
  thumbnailUrl: z.string().url().optional(),
  thumbnailPublicId: z.string().optional(),
})

export const createOfferZodSchema = z.object({
  body: offerBaseSchema,
})

export const updateOfferZodSchema = z.object({
  body: offerBaseSchema.partial(),
})

export const getOfferParamZodSchema = z.object({
  params: z.object({
    id: z.string().uuid('must be a valid UUID'),
  }),
})

export const getAllOfferQueryZodSchema = z.object({
  query: z.object({
    // filtering
    searchTerm: z.string().trim().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),

    // pagination
    page: z.coerce.number().positive().optional(),
    limit: z.coerce.number().positive().max(100).optional(),

    // sorting
    sortBy: z
      .enum(['title', 'discount', 'validUntil', 'status', 'createdAt', 'updatedAt'])
      .optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
})
