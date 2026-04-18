import z from 'zod'

const shopCategorySchema = z.enum(['MENS', 'WOMENS', 'CHILDRENS', 'ACCESSORIES', 'OTHER'])
const shopProductTypeSchema = z.enum(['STANDARD', 'EXCLUSIVE'])
const shopProductStatusSchema = z.enum(['ACTIVE', 'INACTIVE'])
const shopOrderStatusSchema = z.enum([
  'PENDING',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
])

export const shopProductBaseSchema = z.object({
  name: z.string().trim().min(2, 'at least 2 characters'),
  title: z.string().trim().min(2, 'at least 2 characters'),
  description: z.string().trim().min(5, 'at least 5 characters'),
  imageUrls: z.array(z.string().url()).optional(),
  imagePublicIds: z.array(z.string()).optional(),
  sizes: z.array(z.string().trim().min(1)).default([]).optional(),
  price: z.coerce.number().positive('price must be greater than 0'),
  type: shopProductTypeSchema.default('STANDARD').optional(),
  status: shopProductStatusSchema.default('ACTIVE').optional(),
  details: z.string().trim().optional(),
  categories: z.array(shopCategorySchema).min(1, 'at least one category is required'),
})

export const createShopProductZodSchema = z.object({
  body: shopProductBaseSchema,
})

export const updateShopProductZodSchema = z.object({
  body: shopProductBaseSchema.partial(),
})

export const getShopProductParamZodSchema = z.object({
  params: z.object({
    id: z.string().uuid('must be a valid UUID'),
  }),
})

export const getAllShopProductQueryZodSchema = z.object({
  query: z.object({
    searchTerm: z.string().trim().optional(),
    category: shopCategorySchema.optional(),
    type: shopProductTypeSchema.optional(),
    status: shopProductStatusSchema.optional(),
    page: z.coerce.number().positive().optional(),
    limit: z.coerce.number().positive().max(100).optional(),
    sortBy: z
      .enum(['name', 'title', 'price', 'type', 'status', 'createdAt', 'updatedAt'])
      .optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
})

export const checkoutShopProductZodSchema = z.object({
  params: z.object({
    id: z.string().uuid('must be a valid UUID'),
  }),
  body: z.object({
    customerName: z.string().trim().min(2, 'at least 2 characters'),
    customerPhone: z.string().trim().optional(),
    customerEmail: z.string().email().optional(),
    deliveryLocation: z.string().trim().optional(),
    size: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  }),
})

export const getAllShopOrderQueryZodSchema = z.object({
  query: z.object({
    searchTerm: z.string().trim().optional(),
    status: shopOrderStatusSchema.optional(),
    productId: z.string().uuid('must be a valid UUID').optional(),
    userId: z.string().uuid('must be a valid UUID').optional(),
    page: z.coerce.number().positive().optional(),
    limit: z.coerce.number().positive().max(100).optional(),
    sortBy: z
      .enum(['productName', 'customerName', 'price', 'status', 'createdAt', 'updatedAt'])
      .optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
})

export const updateShopOrderStatusZodSchema = z.object({
  params: z.object({
    id: z.string().uuid('must be a valid UUID'),
  }),
  body: z.object({
    status: shopOrderStatusSchema,
  }),
})
