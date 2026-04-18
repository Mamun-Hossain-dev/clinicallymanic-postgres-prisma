import z from 'zod'
import {
  createCheckoutZodSchema,
  createPlanZodSchema,
  getAllPlansQueryZodSchema,
  getAllSubscriptionsQueryZodSchema,
  refundRequestZodSchema,
  updatePlanZodSchema,
} from './subscription.validation'

export type CreatePlanInput = z.infer<typeof createPlanZodSchema>['body']
export type UpdatePlanInput = z.infer<typeof updatePlanZodSchema>['body']

export type GetAllPlansInput = z.infer<typeof getAllPlansQueryZodSchema>['query']
export type PlanFilterOptions = Pick<GetAllPlansInput, 'searchTerm' | 'interval' | 'isActive'>
export type PlanPaginationOptions = Pick<
  GetAllPlansInput,
  'page' | 'limit' | 'sortBy' | 'sortOrder'
>

export type CreateCheckoutInput = z.infer<typeof createCheckoutZodSchema>['body']
export type RefundRequestInput = z.infer<typeof refundRequestZodSchema>['body']

export type GetAllSubscriptionsInput = z.infer<typeof getAllSubscriptionsQueryZodSchema>['query']
export type SubscriptionFilterOptions = Pick<
  GetAllSubscriptionsInput,
  'searchTerm' | 'status' | 'planId' | 'userId'
>
export type SubscriptionPaginationOptions = Pick<
  GetAllSubscriptionsInput,
  'page' | 'limit' | 'sortBy' | 'sortOrder'
>

export type Requester = {
  id: string
  role: string
  email?: string
}
