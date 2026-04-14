import z from 'zod'
import { createUserZodSchema, getAllUsersZodSchema } from './user.validation'

// Additional types for create user inputs
export type CreateUserInput = z.infer<typeof createUserZodSchema>['body']

// Additional types for get all users inputs
export type GetAllUsersInput = z.infer<typeof getAllUsersZodSchema>['query']

// filter options type
export type UserFilterOptions = Pick<
  GetAllUsersInput,
  'searchTerm' | 'firstName' | 'lastName' | 'email' | 'role'
>

// pagination options type
export type UserPaginationOptions = Pick<
  GetAllUsersInput,
  'page' | 'limit' | 'sortBy' | 'sortOrder'
>
