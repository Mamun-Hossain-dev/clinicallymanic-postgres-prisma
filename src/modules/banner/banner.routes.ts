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

/**
 * @swagger
 * tags:
 *   name: Banners
 *   description: Banner management endpoints
 */

/**
 * @swagger
 * /banners:
 *   post:
 *     summary: Create a new banner (with image upload)
 *     tags: [Banners]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               bannerImage:
 *                 type: string
 *                 format: binary
 *                 description: Banner image file
 *               title:
 *                 type: string
 *                 example: Summer Sale
 *               subtitle:
 *                 type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Banner created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Banner'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/',
  fileUploader.upload.single('bannerImage'),
  validateRequest(createBannerZodSchema),
  bannerController.createBanner
)

/**
 * @swagger
 * /banners:
 *   get:
 *     summary: Get all banners (public)
 *     tags: [Banners]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200:
 *         description: Banners retrieved
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
 *                         $ref: '#/components/schemas/Banner'
 */
router.get('/', validateRequest(getAllBannerQueryZodSchema), bannerController.getAllBanners)

/**
 * @swagger
 * /banners/{id}:
 *   get:
 *     summary: Get a banner by ID (public)
 *     tags: [Banners]
 *     parameters:
 *       - $ref: '#/components/schemas/UuidParam'
 *     responses:
 *       200:
 *         description: Banner retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Banner'
 *       404:
 *         description: Banner not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', validateRequest(getBannerParamZodSchema), bannerController.getBannerById)

/**
 * @swagger
 * /banners/{id}:
 *   patch:
 *     summary: Update a banner by ID (with optional image upload)
 *     tags: [Banners]
 *     parameters:
 *       - $ref: '#/components/schemas/UuidParam'
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               bannerImage:
 *                 type: string
 *                 format: binary
 *               title:
 *                 type: string
 *               subtitle:
 *                 type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Banner updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Banner'
 *       404:
 *         description: Banner not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  '/:id',
  fileUploader.upload.single('bannerImage'),
  validateRequest(getBannerParamZodSchema),
  validateRequest(updateBannerZodSchema),
  bannerController.updateBannerById
)

/**
 * @swagger
 * /banners/{id}:
 *   delete:
 *     summary: Delete a banner by ID
 *     tags: [Banners]
 *     parameters:
 *       - $ref: '#/components/schemas/UuidParam'
 *     responses:
 *       200:
 *         description: Banner deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Banner not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id', validateRequest(getBannerParamZodSchema), bannerController.deleteBannerById)

export const bannerRoutes = router
