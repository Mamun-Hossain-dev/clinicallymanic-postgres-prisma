import z from 'zod'

const contentCommonShape = {
  title: z.string().min(2, 'at least 2 characters'),
  description: z.string().min(5, 'at least 5 characters'),
  category: z.string().min(2, 'at least 2 characters'),
  thumbnailUrl: z.string().url().optional(),
  thumbnailPublicId: z.string().optional(),
}

const articleContentSchema = z.object({
  type: z.literal('ARTICLE'),
  ...contentCommonShape,
  body: z.string().min(10, 'article body must be at least 10 characters'),
})

const youtubeContentSchema = z.object({
  type: z.literal('YOUTUBE'),
  ...contentCommonShape,
  videoUrl: z.string().url('must be a valid YouTube URL'),
})

const spotifyContentSchema = z.object({
  type: z.literal('SPOTIFY'),
  ...contentCommonShape,
  audioUrl: z.string().url('must be a valid Spotify URL'),
})

export const contentBodySchema = z.discriminatedUnion('type', [
  articleContentSchema,
  youtubeContentSchema,
  spotifyContentSchema,
])

export const createContentZodSchema = z.object({
  body: contentBodySchema,
})

// Update: type cannot change after creation; all other fields optional.
// Type-specific fields are validated at service layer against the existing record.
export const updateContentZodSchema = z.object({
  body: z
    .object({
      title: z.string().min(2, 'at least 2 characters').optional(),
      description: z.string().min(5, 'at least 5 characters').optional(),
      category: z.string().min(2, 'at least 2 characters').optional(),
      thumbnailUrl: z.string().url().optional(),
      thumbnailPublicId: z.string().optional(),
      body: z.string().min(10, 'at least 10 characters').optional(),
      videoUrl: z.string().url().optional(),
      audioUrl: z.string().url().optional(),
    })
    .strict(),
})

export const getContentParamZodSchema = z.object({
  params: z.object({
    id: z.string().uuid('must be a valid UUID'),
  }),
})

export const getAllContentQueryZodSchema = z.object({
  query: z.object({
    // filtering
    searchTerm: z.string().trim().optional(),
    type: z.enum(['ARTICLE', 'YOUTUBE', 'SPOTIFY']).optional(),
    category: z.string().trim().optional(),

    // pagination
    page: z.coerce.number().positive().optional(),
    limit: z.coerce.number().positive().max(100).optional(),

    // sorting
    sortBy: z.enum(['title', 'type', 'category', 'createdAt', 'updatedAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
})
