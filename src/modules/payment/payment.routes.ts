import { Router } from 'express'
import auth from '../../middlewares/auth'
import validateRequest from '../../middlewares/validateRequest'
import { userRole } from '../user/user.constants'
import { paymentController } from './payment.controller'
import { getAllPaymentQueryZodSchema } from './payment.validation'

const router = Router()

router.get(
  '/',
  auth(userRole.admin, userRole.user),
  validateRequest(getAllPaymentQueryZodSchema),
  paymentController.getAllPayments
)

export const paymentRoutes = router
