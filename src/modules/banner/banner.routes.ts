import express from 'express'
import validateRequest from '../../middlewares/validateRequest'
import { fileUploader } from '../../utils/fileUpload'
import { bannerController } from './banner.controller'
import {
  createBannerZodSchema,
  getAllBannerQueryZodSchema,
  getBannerParamZodSchema,
  updateBannerZodSchema,
} from './banner.validation'

const router = express.Router()

// Create banner with image upload
router.post(
  '/',
  fileUploader.upload.single('bannerImage'),
  validateRequest(createBannerZodSchema),
  bannerController.createBanner
)

// Get all banners
router.get('/', validateRequest(getAllBannerQueryZodSchema), bannerController.getAllBanners)

// Get single banner
router.get('/:id', validateRequest(getBannerParamZodSchema), bannerController.getBannerById)

// Update banner with image upload
router.patch(
  '/:id',
  fileUploader.upload.single('bannerImage'),
  validateRequest(getBannerParamZodSchema),
  validateRequest(updateBannerZodSchema),
  bannerController.updateBannerById
)

// Delete banner
router.delete('/:id', validateRequest(getBannerParamZodSchema), bannerController.deleteBannerById)

export const bannerRoutes = router
