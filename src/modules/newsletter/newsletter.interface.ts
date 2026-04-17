import z from 'zod'
import {
  broadcastNewsletterZodSchema,
  createNewsletterZodSchema,
  getAllNewsletterQueryZodSchema,
  updateNewsletterZodSchema,
} from './newsletter.validation'

export type CreateNewsletterInput = z.infer<typeof createNewsletterZodSchema>['body']
export type UpdateNewsletterInput = z.infer<typeof updateNewsletterZodSchema>['body']
export type GetAllNewslettersInput = z.infer<typeof getAllNewsletterQueryZodSchema>['query']
export type BroadcastNewsletterInput = z.infer<typeof broadcastNewsletterZodSchema>['body']

export type NewsletterFilterOptions = Pick<GetAllNewslettersInput, 'searchTerm' | 'email'>

export type NewsletterPaginationOptions = Pick<
  GetAllNewslettersInput,
  'page' | 'limit' | 'sortBy' | 'sortOrder'
>
