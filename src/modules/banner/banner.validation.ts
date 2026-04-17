import z from 'zod'

export const bannerBaseSchema = z.object({
  title: z.string().min(2, 'at least 2 characters'),
  description: z.string().min(5, 'at least 5 characters'),
  category: z.string().min(2, 'at least 2 characters'),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('INACTIVE').optional(),
  bannerImageUrl: z.string().url().optional(),
  bannerImagePublicId: z.string().optional(),
})

export const createBannerZodSchema = z.object({
  body: bannerBaseSchema,
})

export const updateBannerZodSchema = z.object({
  body: bannerBaseSchema
    .pick({
      title: true,
      description: true,
      category: true,
      status: true,
      bannerImageUrl: true,
      bannerImagePublicId: true,
    })
    .partial(),
})

export const getBannerParamZodSchema = z.object({
  params: z.object({
    id: z.string().uuid('must be a valid UUID'),
  }),
})

export const getAllBannerQueryZodSchema = z.object({
  query: z.object({
    // filtering
    searchTerm: z.string().trim().optional(),
    category: z.string().trim().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),

    // pagination
    page: z.coerce.number().positive().optional(),
    limit: z.coerce.number().positive().max(100).optional(),

    // sorting
    sortBy: z.enum(['title', 'category', 'status', 'createdAt', 'updatedAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
})
