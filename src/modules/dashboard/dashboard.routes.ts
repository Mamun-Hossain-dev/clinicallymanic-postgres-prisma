import { Router } from 'express'
import auth from '../../middlewares/auth'
import validateRequest from '../../middlewares/validateRequest'
import { userRole } from '../user/user.constants'
import { dashboardController } from './dashboard.controller'
import { recentActivityQueryZodSchema, yearQueryZodSchema } from './dashboard.validation'

const router = Router()

router.get('/overview', auth(userRole.admin), dashboardController.getOverview)

router.get(
  '/revenue-overview',
  auth(userRole.admin),
  validateRequest(yearQueryZodSchema),
  dashboardController.getRevenueByMonth
)

router.get(
  '/revenue-by-type',
  auth(userRole.admin),
  validateRequest(yearQueryZodSchema),
  dashboardController.getRevenueByTypeMonthly
)

router.get(
  '/user-growth',
  auth(userRole.admin),
  validateRequest(yearQueryZodSchema),
  dashboardController.getUserGrowthByMonth
)

router.get(
  '/subscription-growth',
  auth(userRole.admin),
  validateRequest(yearQueryZodSchema),
  dashboardController.getSubscriptionGrowthByMonth
)

router.get(
  '/top-plans',
  auth(userRole.admin),
  validateRequest(recentActivityQueryZodSchema),
  dashboardController.getTopPlans
)

router.get(
  '/recent-activity',
  auth(userRole.admin),
  validateRequest(recentActivityQueryZodSchema),
  dashboardController.getRecentActivity
)

export const dashboardRoutes = router
