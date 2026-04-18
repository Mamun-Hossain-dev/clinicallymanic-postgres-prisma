import { Request, Response } from 'express'
import catchAsync from '../../utils/catchAsync'
import sendResponse from '../../utils/sendResponse'
import { dashboardService } from './dashboard.service'

const getOverview = catchAsync(async (_req: Request, res: Response) => {
  const result = await dashboardService.getOverview()
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Dashboard overview retrieved successfully',
    data: result,
  })
})

const getRevenueByMonth = catchAsync(async (req: Request, res: Response) => {
  const year = req.query.year ? Number(req.query.year) : undefined
  const result = await dashboardService.getRevenueByMonth(year)
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Monthly revenue retrieved successfully',
    data: result,
  })
})

const getRevenueByTypeMonthly = catchAsync(async (req: Request, res: Response) => {
  const year = req.query.year ? Number(req.query.year) : undefined
  const result = await dashboardService.getRevenueByTypeMonthly(year)
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Monthly revenue by type retrieved successfully',
    data: result,
  })
})

const getUserGrowthByMonth = catchAsync(async (req: Request, res: Response) => {
  const year = req.query.year ? Number(req.query.year) : undefined
  const result = await dashboardService.getUserGrowthByMonth(year)
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Monthly user growth retrieved successfully',
    data: result,
  })
})

const getSubscriptionGrowthByMonth = catchAsync(async (req: Request, res: Response) => {
  const year = req.query.year ? Number(req.query.year) : undefined
  const result = await dashboardService.getSubscriptionGrowthByMonth(year)
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Monthly subscription growth retrieved successfully',
    data: result,
  })
})

const getTopPlans = catchAsync(async (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 5
  const result = await dashboardService.getTopPlans(limit)
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Top plans retrieved successfully',
    data: result,
  })
})

const getRecentActivity = catchAsync(async (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 10
  const result = await dashboardService.getRecentActivity(limit)
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Recent activity retrieved successfully',
    data: result,
  })
})

export const dashboardController = {
  getOverview,
  getRevenueByMonth,
  getRevenueByTypeMonthly,
  getUserGrowthByMonth,
  getSubscriptionGrowthByMonth,
  getTopPlans,
  getRecentActivity,
}
