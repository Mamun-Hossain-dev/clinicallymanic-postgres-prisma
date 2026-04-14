import express from 'express'
import auth from '../../middlewares/auth'
import validateRequest from '../../middlewares/validateRequest'
import { userRole } from '../user/user.constants'
import { authController } from './auth.controller'
import {
  ChangePasswordZodSchema,
  ForgotPasswordZodSchema,
  LoginUserZodSchema,
  RegisterUserZodSchema,
  ResetPasswordZodSchema,
  VerifyEmailZodSchema,
} from './auth.validation'

const router = express.Router()

router.post('/register', validateRequest(RegisterUserZodSchema), authController.registerUser)
router.post('/login', validateRequest(LoginUserZodSchema), authController.loginUser)
router.post('/refresh-token', authController.refreshToken)
router.post(
  '/forgot-password',
  validateRequest(ForgotPasswordZodSchema),
  authController.forgotPassword
)
router.post('/verify-email', validateRequest(VerifyEmailZodSchema), authController.verifyEmail)
router.post(
  '/reset-password',
  validateRequest(ResetPasswordZodSchema),
  authController.resetPassword
)
router.post(
  '/change-password',
  validateRequest(ChangePasswordZodSchema),
  auth(userRole.admin, userRole.user),
  authController.changePassword
)
router.post('/logout', authController.logoutUser)

export const authRoutes = router
