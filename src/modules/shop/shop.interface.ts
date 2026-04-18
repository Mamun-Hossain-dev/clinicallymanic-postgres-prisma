import z from 'zod'
import {
  checkoutShopProductZodSchema,
  getAllShopOrderQueryZodSchema,
  getAllShopProductQueryZodSchema,
} from './shop.validation'

export type GetAllShopProductsInput = z.infer<typeof getAllShopProductQueryZodSchema>['query']
export type GetAllShopOrdersInput = z.infer<typeof getAllShopOrderQueryZodSchema>['query']
export type CheckoutShopProductInput = z.infer<typeof checkoutShopProductZodSchema>['body']

export type ShopProductFilterOptions = Pick<
  GetAllShopProductsInput,
  'searchTerm' | 'category' | 'type' | 'status'
>

export type ShopProductPaginationOptions = Pick<
  GetAllShopProductsInput,
  'page' | 'limit' | 'sortBy' | 'sortOrder'
>

export type ShopOrderFilterOptions = Pick<
  GetAllShopOrdersInput,
  'searchTerm' | 'status' | 'productId' | 'userId'
>

export type ShopOrderPaginationOptions = Pick<
  GetAllShopOrdersInput,
  'page' | 'limit' | 'sortBy' | 'sortOrder'
>
