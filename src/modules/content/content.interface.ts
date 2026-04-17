import z from 'zod'
import {
  createContentZodSchema,
  getAllContentQueryZodSchema,
  updateContentZodSchema,
} from './content.validation'

export type CreateContentInput = z.infer<typeof createContentZodSchema>['body']
export type UpdateContentInput = z.infer<typeof updateContentZodSchema>['body']
export type GetAllContentsInput = z.infer<typeof getAllContentQueryZodSchema>['query']

export type ContentFilterOptions = Pick<GetAllContentsInput, 'searchTerm' | 'type' | 'category'>

export type ContentPaginationOptions = Pick<
  GetAllContentsInput,
  'page' | 'limit' | 'sortBy' | 'sortOrder'
>
