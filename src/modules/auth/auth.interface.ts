import z from 'zod'
import {
  ChangePasswordZodSchema,
  ForgotPasswordZodSchema,
  LoginUserZodSchema,
  RegisterUserZodSchema,
  ResetPasswordZodSchema,
  VerifyEmailZodSchema,
} from './auth.validation'

export type RegisterPayloadInput = z.infer<typeof RegisterUserZodSchema>['body']

export type LoginPayloadInput = z.infer<typeof LoginUserZodSchema>['body']

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordZodSchema>['body']

export type verifyEmailInput = z.infer<typeof VerifyEmailZodSchema>['body']

export type resetPasswordZodInput = z.infer<typeof ResetPasswordZodSchema>['body']

export type ChangePasswordZodInput = z.infer<typeof ChangePasswordZodSchema>
