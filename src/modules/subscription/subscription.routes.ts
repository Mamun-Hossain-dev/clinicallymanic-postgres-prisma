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

// ---- Plan CRUD (Admin only for write, public-ish for read) ----
router.post(
  '/plans',
  auth(userRole.admin),
  validateRequest(createPlanZodSchema),
  subscriptionController.createPlan
)

router.patch(
  '/plans/:id',
  auth(userRole.admin),
  validateRequest(updatePlanZodSchema),
  subscriptionController.updatePlan
)

router.delete(
  '/plans/:id',
  auth(userRole.admin),
  validateRequest(planIdParamZodSchema),
  subscriptionController.deletePlan
)

router.get('/plans', validateRequest(getAllPlansQueryZodSchema), subscriptionController.getAllPlans)

router.get('/plans/:id', validateRequest(planIdParamZodSchema), subscriptionController.getPlanById)

// ---- User subscription flows ----
router.post(
  '/checkout',
  auth(userRole.user, userRole.admin),
  validateRequest(createCheckoutZodSchema),
  subscriptionController.createCheckoutSession
)

router.get('/me', auth(userRole.user, userRole.admin), subscriptionController.getMySubscription)

router.get(
  '/',
  auth(userRole.admin, userRole.user),
  validateRequest(getAllSubscriptionsQueryZodSchema),
  subscriptionController.getAllSubscriptions
)

router.get(
  '/:id',
  auth(userRole.admin, userRole.user),
  validateRequest(subscriptionIdParamZodSchema),
  subscriptionController.getSubscriptionById
)

router.post(
  '/:id/cancel',
  auth(userRole.admin, userRole.user),
  validateRequest(subscriptionIdParamZodSchema),
  subscriptionController.cancelSubscription
)

router.post(
  '/:id/resume',
  auth(userRole.admin, userRole.user),
  validateRequest(subscriptionIdParamZodSchema),
  subscriptionController.resumeSubscription
)

router.post(
  '/:id/refund',
  auth(userRole.admin, userRole.user),
  validateRequest(refundRequestZodSchema),
  subscriptionController.requestRefund
)

export const subscriptionRoutes = router
