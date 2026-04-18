import { Request, Response } from 'express'
import catchAsync from '../../utils/catchAsync'
import pick from '../../utils/pick'
import sendResponse from '../../utils/sendResponse'
import { PaymentFilterOptions, PaymentPaginationOptions } from './payment.interface'
import { paymentService } from './payment.service'

const getAllPayments = catchAsync(async (req: Request, res: Response) => {
  const requester = {
    id: req.user?.id as string,
    role: req.user?.role as string,
  }
  const filterOptions = pick(req.query, [
    'searchTerm',
    'status',
    'type',
    'userId',
  ]) as PaymentFilterOptions
  const paginationOptions = pick(req.query, [
    'page',
    'limit',
    'sortBy',
    'sortOrder',
  ]) as PaymentPaginationOptions

  const result = await paymentService.getAllPayments(requester, filterOptions, paginationOptions)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Payments retrieved successfully',
    meta: result.meta,
    data: result.data,
  })
})

const handleStripeWebhook = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.handleStripeWebhook(
    req.body as Buffer,
    req.headers['stripe-signature']
  )

  res.status(200).json(result)
})

export const paymentController = {
  getAllPayments,
  handleStripeWebhook,
}
