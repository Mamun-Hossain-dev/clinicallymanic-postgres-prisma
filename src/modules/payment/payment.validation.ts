import z from 'zod'

const paymentStatusSchema = z.enum(['PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'CANCELLED'])
const paymentTypeSchema = z.enum(['SHOP', 'SUBSCRIPTION'])

export const getAllPaymentQueryZodSchema = z.object({
  query: z.object({
    searchTerm: z.string().trim().optional(),
    status: paymentStatusSchema.optional(),
    type: paymentTypeSchema.optional(),
    userId: z.string().uuid('must be a valid UUID').optional(),
    page: z.coerce.number().positive().optional(),
    limit: z.coerce.number().positive().max(100).optional(),
    sortBy: z.enum(['amount', 'currency', 'status', 'type', 'createdAt', 'updatedAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
})
