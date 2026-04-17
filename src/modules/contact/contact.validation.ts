import z from 'zod'

export const contactBaseSchema = z.object({
  name: z.string().min(2, 'at least 2 characters'),
  email: z.string().email('must be a valid email'),
  phoneNumber: z.string().min(5, 'at least 5 characters'),
  occupation: z.string().min(2, 'at least 2 characters'),
  subject: z.string().min(2, 'at least 2 characters'),
  message: z.string().min(5, 'at least 5 characters'),
  isRead: z.boolean().optional(),
})

export const createContactZodSchema = z.object({
  body: contactBaseSchema,
})

export const updateContactZodSchema = z.object({
  body: contactBaseSchema.partial(),
})

export const getContactParamZodSchema = z.object({
  params: z.object({
    id: z.string().uuid('must be a valid UUID'),
  }),
})

export const getAllContactQueryZodSchema = z.object({
  query: z.object({
    // filtering
    searchTerm: z.string().trim().optional(),
    name: z.string().trim().optional(),
    email: z.string().trim().optional(),
    phoneNumber: z.string().trim().optional(),
    subject: z.string().trim().optional(),
    isRead: z
      .union([z.boolean(), z.enum(['true', 'false']).transform(v => v === 'true')])
      .optional(),

    // pagination
    page: z.coerce.number().positive().optional(),
    limit: z.coerce.number().positive().max(100).optional(),

    // sorting
    sortBy: z.enum(['name', 'email', 'subject', 'isRead', 'createdAt', 'updatedAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
})
