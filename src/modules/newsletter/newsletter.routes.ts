import express from 'express'
import auth from '../../middlewares/auth'
import validateRequest from '../../middlewares/validateRequest'
import { userRole } from '../user/user.constants'
import { newsletterController } from './newsletter.controller'
import {
  broadcastNewsletterZodSchema,
  createNewsletterZodSchema,
  getAllNewsletterQueryZodSchema,
  getNewsletterParamZodSchema,
  updateNewsletterZodSchema,
} from './newsletter.validation'

const router = express.Router()

// Broadcast email to all subscribers (admin only) — declared before "/" to avoid conflict
router.post(
  '/broadcast',
  auth(userRole.admin),
  validateRequest(broadcastNewsletterZodSchema),
  newsletterController.broadcastNewsletter
)

// Subscribe (public)
router.post('/', validateRequest(createNewsletterZodSchema), newsletterController.createNewsletter)

// List subscribers (admin only)
router.get(
  '/',
  auth(userRole.admin),
  validateRequest(getAllNewsletterQueryZodSchema),
  newsletterController.getAllNewsletters
)

// Get single subscriber (admin only)
router.get(
  '/:id',
  auth(userRole.admin),
  validateRequest(getNewsletterParamZodSchema),
  newsletterController.getNewsletterById
)

// Update subscriber (admin only)
router.patch(
  '/:id',
  auth(userRole.admin),
  validateRequest(getNewsletterParamZodSchema),
  validateRequest(updateNewsletterZodSchema),
  newsletterController.updateNewsletterById
)

// Delete subscriber (admin only)
router.delete(
  '/:id',
  auth(userRole.admin),
  validateRequest(getNewsletterParamZodSchema),
  newsletterController.deleteNewsletterById
)

export const newsletterRoutes = router
