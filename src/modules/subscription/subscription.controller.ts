import { Request, Response } from 'express'
import catchAsync from '../../utils/catchAsync'
import pick from '../../utils/pick'
import sendResponse from '../../utils/sendResponse'
import {
  PlanFilterOptions,
  PlanPaginationOptions,
  Requester,
  SubscriptionFilterOptions,
  SubscriptionPaginationOptions,
} from './subscription.interface'
import { subscriptionService } from './subscription.service'

const getRequester = (req: Request): Requester => ({
  id: req.user?.id as string,
  role: req.user?.role as string,
  email: req.user?.email as string | undefined,
})

// ---- Plan CRUD ----

const createPlan = catchAsync(async (req: Request, res: Response) => {
  const result = await subscriptionService.createPlan(req.body)
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Subscription plan created successfully',
    data: result,
  })
})

const updatePlan = catchAsync(async (req: Request, res: Response) => {
  const result = await subscriptionService.updatePlan(req.params.id as string, req.body)
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Subscription plan updated successfully',
    data: result,
  })
})

const deletePlan = catchAsync(async (req: Request, res: Response) => {
  const result = await subscriptionService.deletePlan(req.params.id as string)
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Subscription plan deleted successfully',
    data: result,
  })
})

const getPlanById = catchAsync(async (req: Request, res: Response) => {
  const result = await subscriptionService.getPlanById(req.params.id as string)
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Subscription plan retrieved successfully',
    data: result,
  })
})

const getAllPlans = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ['searchTerm', 'interval', 'isActive']) as PlanFilterOptions
  const paginationOptions = pick(req.query, [
    'page',
    'limit',
    'sortBy',
    'sortOrder',
  ]) as PlanPaginationOptions

  const result = await subscriptionService.getAllPlans(filters, paginationOptions)
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Subscription plans retrieved successfully',
    meta: result.meta,
    data: result.data,
  })
})

// ---- User-facing ----

const createCheckoutSession = catchAsync(async (req: Request, res: Response) => {
  const requester = getRequester(req)
  const result = await subscriptionService.createCheckoutSession(requester, req.body)
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Checkout session created',
    data: result,
  })
})

const getMySubscription = catchAsync(async (req: Request, res: Response) => {
  const requester = getRequester(req)
  const result = await subscriptionService.getMySubscription(requester.id)
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result ? 'Active subscription retrieved' : 'No active subscription',
    data: result,
  })
})

const getSubscriptionById = catchAsync(async (req: Request, res: Response) => {
  const requester = getRequester(req)
  const result = await subscriptionService.getSubscriptionById(requester, req.params.id as string)
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Subscription retrieved successfully',
    data: result,
  })
})

const getAllSubscriptions = catchAsync(async (req: Request, res: Response) => {
  const requester = getRequester(req)
  const filters = pick(req.query, [
    'searchTerm',
    'status',
    'planId',
    'userId',
  ]) as SubscriptionFilterOptions
  const paginationOptions = pick(req.query, [
    'page',
    'limit',
    'sortBy',
    'sortOrder',
  ]) as SubscriptionPaginationOptions

  const result = await subscriptionService.getAllSubscriptions(
    requester,
    filters,
    paginationOptions
  )
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Subscriptions retrieved successfully',
    meta: result.meta,
    data: result.data,
  })
})

const cancelSubscription = catchAsync(async (req: Request, res: Response) => {
  const requester = getRequester(req)
  const result = await subscriptionService.cancelSubscription(requester, req.params.id as string)
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Subscription will be canceled at period end',
    data: result,
  })
})

const resumeSubscription = catchAsync(async (req: Request, res: Response) => {
  const requester = getRequester(req)
  const result = await subscriptionService.resumeSubscription(requester, req.params.id as string)
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Subscription resumed successfully',
    data: result,
  })
})

const requestRefund = catchAsync(async (req: Request, res: Response) => {
  const requester = getRequester(req)
  const result = await subscriptionService.requestRefund(
    requester,
    req.params.id as string,
    req.body
  )
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: '50% refund processed. Access remains until period end.',
    data: result,
  })
})

export const subscriptionController = {
  createPlan,
  updatePlan,
  deletePlan,
  getPlanById,
  getAllPlans,
  createCheckoutSession,
  getMySubscription,
  getSubscriptionById,
  getAllSubscriptions,
  cancelSubscription,
  resumeSubscription,
  requestRefund,
}
