import z from 'zod'
import { getAllPaymentQueryZodSchema } from './payment.validation'

export type GetAllPaymentsInput = z.infer<typeof getAllPaymentQueryZodSchema>['query']

export type PaymentFilterOptions = Pick<
  GetAllPaymentsInput,
  'searchTerm' | 'status' | 'type' | 'userId'
>

export type PaymentPaginationOptions = Pick<
  GetAllPaymentsInput,
  'page' | 'limit' | 'sortBy' | 'sortOrder'
>
