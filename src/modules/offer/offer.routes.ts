import express from 'express'
import auth from '../../middlewares/auth'
import validateRequest from '../../middlewares/validateRequest'
import { fileUploader } from '../../utils/fileUpload'
import { userRole } from '../user/user.constants'
import { offerController } from './offer.controller'
import {
  createOfferZodSchema,
  getAllOfferQueryZodSchema,
  getOfferParamZodSchema,
  updateOfferZodSchema,
} from './offer.validation'

const router = express.Router()

// Create offer with thumbnail (admin only)
router.post(
  '/',
  auth(userRole.admin),
  fileUploader.upload.single('thumbnail'),
  validateRequest(createOfferZodSchema),
  offerController.createOffer
)

// Get all offers (public)
router.get('/', validateRequest(getAllOfferQueryZodSchema), offerController.getAllOffers)

// Get single offer (public)
router.get('/:id', validateRequest(getOfferParamZodSchema), offerController.getOfferById)

// Update offer with thumbnail (admin only)
router.patch(
  '/:id',
  auth(userRole.admin),
  fileUploader.upload.single('thumbnail'),
  validateRequest(getOfferParamZodSchema),
  validateRequest(updateOfferZodSchema),
  offerController.updateOfferById
)

// Delete offer (admin only)
router.delete(
  '/:id',
  auth(userRole.admin),
  validateRequest(getOfferParamZodSchema),
  offerController.deleteOfferById
)

export const offerRoutes = router
