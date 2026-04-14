import { z } from 'zod'
import { userBaseSchema } from '../user/user.validation'

export const RegisterUserZodSchema = z.object({
  body: userBaseSchema
    .pick({
      firstName: true,
      lastName: true,
      email: true,
      password: true,
      role: true,
      profileImage: true,
    })
    .partial({
      role: true,
      profileImage: true,
    }),
})

export const LoginUserZodSchema = z.object({
  body: userBaseSchema
    .pick({
      email: true,
      password: true,
    })
    .required(),
})

export const ForgotPasswordZodSchema = z.object({
  body: userBaseSchema
    .pick({
      email: true,
    })
    .required(),
})

export const VerifyEmailZodSchema = z.object({
  body: userBaseSchema
    .pick({
      email: true,
      otp: true,
    })
    .required(),
})

export const ResetPasswordZodSchema = z.object({
  body: z.object({
    email: z.string().email(),
    newPassword: z.string().min(6),
  }),
})

export const ChangePasswordZodSchema = z.object({
  params: z.object({
    id: z.string().uuid('must be a valid UUID'),
  }),
  body: z.object({
    oldPassword: z.string().min(6),
    newPassword: z.string().min(6),
  }),
})
