import express from 'express'
import auth from '../../middlewares/auth'
import validateRequest from '../../middlewares/validateRequest'
import { userRole } from '../user/user.constants'
import { contactController } from './contact.controller'
import {
  createContactZodSchema,
  getAllContactQueryZodSchema,
  getContactParamZodSchema,
  updateContactZodSchema,
} from './contact.validation'

const router = express.Router()

// Create contact (public)
router.post('/', validateRequest(createContactZodSchema), contactController.createContact)

// Get all contacts (admin only)
router.get(
  '/',
  auth(userRole.admin),
  validateRequest(getAllContactQueryZodSchema),
  contactController.getAllContacts
)

// Get single contact (admin only)
router.get(
  '/:id',
  auth(userRole.admin),
  validateRequest(getContactParamZodSchema),
  contactController.getContactById
)

// Update contact (admin only)
router.patch(
  '/:id',
  auth(userRole.admin),
  validateRequest(getContactParamZodSchema),
  validateRequest(updateContactZodSchema),
  contactController.updateContactById
)

// Delete contact (admin only)
router.delete(
  '/:id',
  auth(userRole.admin),
  validateRequest(getContactParamZodSchema),
  contactController.deleteContactById
)

export const contactRoutes = router
