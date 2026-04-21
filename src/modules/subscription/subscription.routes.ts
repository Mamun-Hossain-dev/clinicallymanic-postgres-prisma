import { Router } from 'express'
import auth from '../../middlewares/auth'
import validateRequest from '../../middlewares/validateRequest'
import { userRole } from '../user/user.constants'
import { subscriptionController } from './subscription.controller'
import {
  createCheckoutZodSchema,
  createPlanZodSchema,
  getAllPlansQueryZodSchema,
  getAllSubscriptionsQueryZodSchema,
  planIdParamZodSchema,
  refundRequestZodSchema,
  subscriptionIdParamZodSchema,
  updatePlanZodSchema,
} from './subscription.validation'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Subscriptions
 *   description: Subscription plans and user subscription management
 */

// ─────────────────────── PLANS ────────────────────────────────────────────────

/**
 * @swagger
 * /subscriptions/plans:
 *   post:
 *     summary: Create a subscription plan (admin only)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price, interval]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Pro Monthly
 *               description:
 *                 type: string
 *                 example: Unlimited access to all features
 *               price:
 *                 type: number
 *                 example: 9.99
 *               interval:
 *                 type: string
 *                 enum: [month, year]
 *                 example: month
 *               features:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["Unlimited access", "Priority support"]
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Plan created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/SubscriptionPlan'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/plans',
  auth(userRole.admin),
  validateRequest(createPlanZodSchema),
  subscriptionController.createPlan
)

/**
 * @swagger
 * /subscriptions/plans/{id}:
 *   patch:
 *     summary: Update a subscription plan (admin only)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/schemas/UuidParam'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               interval:
 *                 type: string
 *                 enum: [month, year]
 *               features:
 *                 type: array
 *                 items: { type: string }
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Plan updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/SubscriptionPlan'
 */
router.patch(
  '/plans/:id',
  auth(userRole.admin),
  validateRequest(updatePlanZodSchema),
  subscriptionController.updatePlan
)

/**
 * @swagger
 * /subscriptions/plans/{id}:
 *   delete:
 *     summary: Delete a subscription plan (admin only)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/schemas/UuidParam'
 *     responses:
 *       200:
 *         description: Plan deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.delete(
  '/plans/:id',
  auth(userRole.admin),
  validateRequest(planIdParamZodSchema),
  subscriptionController.deletePlan
)

/**
 * @swagger
 * /subscriptions/plans:
 *   get:
 *     summary: Get all subscription plans (public)
 *     tags: [Subscriptions]
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *       - in: query
 *         name: interval
 *         schema: { type: string, enum: [month, year] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *     responses:
 *       200:
 *         description: Plans retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     meta:
 *                       $ref: '#/components/schemas/PaginationMeta'
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SubscriptionPlan'
 */
router.get('/plans', validateRequest(getAllPlansQueryZodSchema), subscriptionController.getAllPlans)

/**
 * @swagger
 * /subscriptions/plans/{id}:
 *   get:
 *     summary: Get a single subscription plan by ID (public)
 *     tags: [Subscriptions]
 *     parameters:
 *       - $ref: '#/components/schemas/UuidParam'
 *     responses:
 *       200:
 *         description: Plan retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/SubscriptionPlan'
 *       404:
 *         description: Plan not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/plans/:id', validateRequest(planIdParamZodSchema), subscriptionController.getPlanById)

// ─────────────────────── USER SUBSCRIPTIONS ───────────────────────────────────

/**
 * @swagger
 * /subscriptions/checkout:
 *   post:
 *     summary: Create a Stripe checkout session for a subscription plan
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [planId]
 *             properties:
 *               planId:
 *                 type: string
 *                 format: uuid
 *                 description: The subscription plan ID to subscribe to
 *     responses:
 *       200:
 *         description: Stripe checkout URL returned
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
 *                         checkoutUrl:
 *                           type: string
 *                           format: uri
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/checkout',
  auth(userRole.user, userRole.admin),
  validateRequest(createCheckoutZodSchema),
  subscriptionController.createCheckoutSession
)

/**
 * @swagger
 * /subscriptions/me:
 *   get:
 *     summary: Get current user's active subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current subscription retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/me', auth(userRole.user, userRole.admin), subscriptionController.getMySubscription)

/**
 * @swagger
 * /subscriptions:
 *   get:
 *     summary: Get all subscriptions (admin and user)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, cancelled, expired, past_due] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200:
 *         description: Subscriptions list retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     meta:
 *                       $ref: '#/components/schemas/PaginationMeta'
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 */
router.get(
  '/',
  auth(userRole.admin, userRole.user),
  validateRequest(getAllSubscriptionsQueryZodSchema),
  subscriptionController.getAllSubscriptions
)

/**
 * @swagger
 * /subscriptions/{id}:
 *   get:
 *     summary: Get a subscription by ID (admin and user)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/schemas/UuidParam'
 *     responses:
 *       200:
 *         description: Subscription retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Subscription not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/:id',
  auth(userRole.admin, userRole.user),
  validateRequest(subscriptionIdParamZodSchema),
  subscriptionController.getSubscriptionById
)

/**
 * @swagger
 * /subscriptions/{id}/cancel:
 *   post:
 *     summary: Cancel a subscription (admin and user)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/schemas/UuidParam'
 *     responses:
 *       200:
 *         description: Subscription cancelled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post(
  '/:id/cancel',
  auth(userRole.admin, userRole.user),
  validateRequest(subscriptionIdParamZodSchema),
  subscriptionController.cancelSubscription
)

/**
 * @swagger
 * /subscriptions/{id}/resume:
 *   post:
 *     summary: Resume a cancelled subscription (admin and user)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/schemas/UuidParam'
 *     responses:
 *       200:
 *         description: Subscription resumed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post(
  '/:id/resume',
  auth(userRole.admin, userRole.user),
  validateRequest(subscriptionIdParamZodSchema),
  subscriptionController.resumeSubscription
)

/**
 * @swagger
 * /subscriptions/{id}/refund:
 *   post:
 *     summary: Request a refund for a subscription (admin and user)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/schemas/UuidParam'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Service not as expected
 *     responses:
 *       200:
 *         description: Refund requested successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post(
  '/:id/refund',
  auth(userRole.admin, userRole.user),
  validateRequest(refundRequestZodSchema),
  subscriptionController.requestRefund
)

export const subscriptionRoutes = router
