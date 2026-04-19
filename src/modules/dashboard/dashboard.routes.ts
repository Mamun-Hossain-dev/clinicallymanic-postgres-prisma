import { Router } from 'express'
import auth from '../../middlewares/auth'
import validateRequest from '../../middlewares/validateRequest'
import { userRole } from '../user/user.constants'
import { dashboardController } from './dashboard.controller'
import { recentActivityQueryZodSchema, yearQueryZodSchema } from './dashboard.validation'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Admin dashboard analytics endpoints
 */

/**
 * @swagger
 * /dashboard/overview:
 *   get:
 *     summary: Get dashboard overview stats (admin only)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overview stats retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         totalUsers:
 *                           type: integer
 *                           example: 1200
 *                         totalRevenue:
 *                           type: number
 *                           example: 45000.50
 *                         activeSubscriptions:
 *                           type: integer
 *                           example: 300
 *                         totalOrders:
 *                           type: integer
 *                           example: 500
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden — admin only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/overview', auth(userRole.admin), dashboardController.getOverview)

/**
 * @swagger
 * /dashboard/revenue-overview:
 *   get:
 *     summary: Get monthly revenue overview for a given year (admin only)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         required: false
 *         schema:
 *           type: integer
 *           example: 2025
 *         description: The year to get revenue data for (defaults to current year)
 *     responses:
 *       200:
 *         description: Monthly revenue data retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: string
 *                             example: January
 *                           revenue:
 *                             type: number
 *                             example: 3500.00
 */
router.get(
  '/revenue-overview',
  auth(userRole.admin),
  validateRequest(yearQueryZodSchema),
  dashboardController.getRevenueByMonth
)

/**
 * @swagger
 * /dashboard/revenue-by-type:
 *   get:
 *     summary: Get monthly revenue broken down by type (admin only)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: { type: integer, example: 2025 }
 *     responses:
 *       200:
 *         description: Revenue by type retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: string
 *                           subscription:
 *                             type: number
 *                           shop:
 *                             type: number
 */
router.get(
  '/revenue-by-type',
  auth(userRole.admin),
  validateRequest(yearQueryZodSchema),
  dashboardController.getRevenueByTypeMonthly
)

/**
 * @swagger
 * /dashboard/user-growth:
 *   get:
 *     summary: Get monthly user growth for a given year (admin only)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: { type: integer, example: 2025 }
 *     responses:
 *       200:
 *         description: User growth data retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: string
 *                           newUsers:
 *                             type: integer
 */
router.get(
  '/user-growth',
  auth(userRole.admin),
  validateRequest(yearQueryZodSchema),
  dashboardController.getUserGrowthByMonth
)

/**
 * @swagger
 * /dashboard/subscription-growth:
 *   get:
 *     summary: Get monthly subscription growth for a given year (admin only)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: { type: integer, example: 2025 }
 *     responses:
 *       200:
 *         description: Subscription growth data retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: string
 *                           newSubscriptions:
 *                             type: integer
 */
router.get(
  '/subscription-growth',
  auth(userRole.admin),
  validateRequest(yearQueryZodSchema),
  dashboardController.getSubscriptionGrowthByMonth
)

/**
 * @swagger
 * /dashboard/top-plans:
 *   get:
 *     summary: Get top performing subscription plans (admin only)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 5 }
 *         description: Number of top plans to return
 *     responses:
 *       200:
 *         description: Top plans retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           planName:
 *                             type: string
 *                           subscribers:
 *                             type: integer
 *                           revenue:
 *                             type: number
 */
router.get(
  '/top-plans',
  auth(userRole.admin),
  validateRequest(recentActivityQueryZodSchema),
  dashboardController.getTopPlans
)

/**
 * @swagger
 * /dashboard/recent-activity:
 *   get:
 *     summary: Get recent activity feed (admin only)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *         description: Number of recent activities to return
 *     responses:
 *       200:
 *         description: Recent activity retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             example: new_subscription
 *                           description:
 *                             type: string
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 */
router.get(
  '/recent-activity',
  auth(userRole.admin),
  validateRequest(recentActivityQueryZodSchema),
  dashboardController.getRecentActivity
)

export const dashboardRoutes = router
