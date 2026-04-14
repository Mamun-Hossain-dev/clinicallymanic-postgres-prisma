import z from 'zod'

export const userBaseSchema = z.object({
  firstName: z.string().min(2, 'at least 2 characters'),
  lastName: z.string().optional(),
  email: z.string().email('must be a valid email'),
  password: z.string().min(6, 'at least 6 characters'),
  role: z.enum(['ADMIN', 'USER', 'GUEST']).default('USER').optional(),
  profileImage: z.string().url().optional(),
  profileImagePublicId: z.string().optional(),
  bio: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  otp: z.string().optional(),
})

export const createUserZodSchema = z.object({
  body: userBaseSchema,
})

export const updateUserZodSchema = z.object({
  body: userBaseSchema
    .pick({
      firstName: true,
      lastName: true,
      bio: true,
      phone: true,
      location: true,
      profileImage: true,
    })
    .partial(),
})

export const getUserParamZodSchema = z.object({
  params: z.object({
    id: z.string().uuid('must be a valid UUID'),
  }),
})

export const getAllUsersZodSchema = z.object({
  query: z.object({
    // filtering
    searchTerm: z.string().trim().optional(),
    firstName: z.string().trim().optional(),
    lastName: z.string().trim().optional(),
    email: z.string().email().optional(),
    role: z.enum(['ADMIN', 'USER', 'GUEST']).default('USER').optional(),

    // pagination
    page: z.coerce.number().positive().optional(),
    limit: z.coerce.number().positive().max(100).optional(),

    // sorting
    sortBy: z.enum(['firstName', 'lastName', 'email', 'createdAt', 'updatedAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
})

export const updateUserPasswordZodSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(6, 'at least 6 characters'),
    newPassword: z.string().min(6, 'at least 6 characters'),
  }),
})
