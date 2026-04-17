import express from 'express'
import auth from '../../middlewares/auth'
import validateRequest from '../../middlewares/validateRequest'
import { fileUploader } from '../../utils/fileUpload'
import { userRole } from '../user/user.constants'
import { contentController } from './content.controller'
import {
  createContentZodSchema,
  getAllContentQueryZodSchema,
  getContentParamZodSchema,
  updateContentZodSchema,
} from './content.validation'

const router = express.Router()

// Create content with optional thumbnail (admin only)
router.post(
  '/',
  auth(userRole.admin),
  fileUploader.upload.single('thumbnail'),
  validateRequest(createContentZodSchema),
  contentController.createContent
)

// List content (public)
router.get('/', validateRequest(getAllContentQueryZodSchema), contentController.getAllContents)

// Get single content (public)
router.get('/:id', validateRequest(getContentParamZodSchema), contentController.getContentById)

// Update content (admin only)
router.patch(
  '/:id',
  auth(userRole.admin),
  fileUploader.upload.single('thumbnail'),
  validateRequest(getContentParamZodSchema),
  validateRequest(updateContentZodSchema),
  contentController.updateContentById
)

// Delete content (admin only)
router.delete(
  '/:id',
  auth(userRole.admin),
  validateRequest(getContentParamZodSchema),
  contentController.deleteContentById
)

export const contentRoutes = router
