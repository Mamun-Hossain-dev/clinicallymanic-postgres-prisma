import z from 'zod'
import { createBannerZodSchema, getAllBannerQueryZodSchema } from './banner.validation'

// Additional types for create banner inputs
export type CreateBannerInput = z.infer<typeof createBannerZodSchema>['body']

// Additional types for get all banners inputs
export type GetAllBannersInput = z.infer<typeof getAllBannerQueryZodSchema>['query']

// filter options type
export type BannerFilterOptions = Pick<GetAllBannersInput, 'searchTerm' | 'category' | 'status'>

// pagination options type
export type BannerPaginationOptions = Pick<
  GetAllBannersInput,
  'page' | 'limit' | 'sortBy' | 'sortOrder'
>
