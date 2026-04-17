import z from 'zod'
import {
  createOfferZodSchema,
  getAllOfferQueryZodSchema,
  updateOfferZodSchema,
} from './offer.validation'

export type CreateOfferInput = z.infer<typeof createOfferZodSchema>['body']
export type UpdateOfferInput = z.infer<typeof updateOfferZodSchema>['body']
export type GetAllOffersInput = z.infer<typeof getAllOfferQueryZodSchema>['query']

export type OfferFilterOptions = Pick<GetAllOffersInput, 'searchTerm' | 'status'>

export type OfferPaginationOptions = Pick<
  GetAllOffersInput,
  'page' | 'limit' | 'sortBy' | 'sortOrder'
>
