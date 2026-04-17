import z from 'zod'
import {
  createContactZodSchema,
  getAllContactQueryZodSchema,
  updateContactZodSchema,
} from './contact.validation'

export type CreateContactInput = z.infer<typeof createContactZodSchema>['body']
export type UpdateContactInput = z.infer<typeof updateContactZodSchema>['body']
export type GetAllContactsInput = z.infer<typeof getAllContactQueryZodSchema>['query']

export type ContactFilterOptions = Pick<
  GetAllContactsInput,
  'searchTerm' | 'name' | 'email' | 'phoneNumber' | 'subject' | 'isRead'
>

export type ContactPaginationOptions = Pick<
  GetAllContactsInput,
  'page' | 'limit' | 'sortBy' | 'sortOrder'
>
