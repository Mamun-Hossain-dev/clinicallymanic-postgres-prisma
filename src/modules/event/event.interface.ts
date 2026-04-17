import z from 'zod'
import {
  createEventZodSchema,
  getAllEventQueryZodSchema,
  updateEventZodSchema,
} from './event.validation'

export type CreateEventInput = z.infer<typeof createEventZodSchema>['body']
export type UpdateEventInput = z.infer<typeof updateEventZodSchema>['body']
export type GetAllEventsInput = z.infer<typeof getAllEventQueryZodSchema>['query']

export type EventFilterOptions = Pick<GetAllEventsInput, 'searchTerm' | 'location' | 'status'>

export type EventPaginationOptions = Pick<
  GetAllEventsInput,
  'page' | 'limit' | 'sortBy' | 'sortOrder'
>
