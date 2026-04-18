import z from 'zod'
import {
  billingIntervalValues,
  planFeatureValues,
  subscriptionStatusValues,
} from './subscription.constants'

const billingIntervalSchema = z.enum(billingIntervalValues)
const subscriptionStatusSchema = z.enum(subscriptionStatusValues)
const planFeatureSchema = z.enum(planFeatureValues)

export const createPlanZodSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Name is required').max(100),
    description: z.string().trim().max(1000).optional(),
    price: z.coerce.number().nonnegative('Price must be >= 0'),
    currency: z.string().trim().length(3).toLowerCase().default('usd'),
    interval: billingIntervalSchema.default('MONTHLY'),
    intervalCount: z.coerce.number().int().positive().default(1),
    trialDays: z.coerce.number().int().nonnegative().default(7),
    features: z.array(planFeatureSchema).default([]),
    isActive: z.boolean().default(true),
    sortOrder: z.coerce.number().int().default(0),
  }),
})

export const updatePlanZodSchema = z.object({
  params: z.object({
    id: z.string().uuid('must be a valid UUID'),
  }),
  body: z.object({
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().trim().max(1000).optional(),
    price: z.coerce.number().nonnegative().optional(),
    currency: z.string().trim().length(3).toLowerCase().optional(),
    interval: billingIntervalSchema.optional(),
    intervalCount: z.coerce.number().int().positive().optional(),
    trialDays: z.coerce.number().int().nonnegative().optional(),
    features: z.array(planFeatureSchema).optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.coerce.number().int().optional(),
  }),
})

export const planIdParamZodSchema = z.object({
  params: z.object({
    id: z.string().uuid('must be a valid UUID'),
  }),
})

export const getAllPlansQueryZodSchema = z.object({
  query: z.object({
    searchTerm: z.string().trim().optional(),
    interval: billingIntervalSchema.optional(),
    isActive: z
      .enum(['true', 'false'])
      .transform(v => v === 'true')
      .optional(),
    page: z.coerce.number().positive().optional(),
    limit: z.coerce.number().positive().max(100).optional(),
    sortBy: z.enum(['name', 'price', 'sortOrder', 'createdAt', 'updatedAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
})

export const createCheckoutZodSchema = z.object({
  body: z.object({
    planId: z.string().uuid('must be a valid UUID'),
    successUrl: z.string().url().optional(),
    cancelUrl: z.string().url().optional(),
  }),
})

export const subscriptionIdParamZodSchema = z.object({
  params: z.object({
    id: z.string().uuid('must be a valid UUID'),
  }),
})

export const refundRequestZodSchema = z.object({
  params: z.object({
    id: z.string().uuid('must be a valid UUID'),
  }),
  body: z.object({
    reason: z.string().trim().min(3).max(500).optional(),
  }),
})

export const getAllSubscriptionsQueryZodSchema = z.object({
  query: z.object({
    searchTerm: z.string().trim().optional(),
    status: subscriptionStatusSchema.optional(),
    planId: z.string().uuid().optional(),
    userId: z.string().uuid().optional(),
    page: z.coerce.number().positive().optional(),
    limit: z.coerce.number().positive().max(100).optional(),
    sortBy: z
      .enum(['status', 'currentPeriodEnd', 'startedAt', 'createdAt', 'updatedAt'])
      .optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
})
