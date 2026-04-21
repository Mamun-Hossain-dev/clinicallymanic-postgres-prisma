import express from 'express'
import auth from '../../middlewares/auth'
import validateRequest from '../../middlewares/validateRequest'
import { fileUploader } from '../../utils/fileUpload'
import { userRole } from '../user/user.constants'
import { offerController } from './offer.controller'
import parseData from '../../middlewares/parseData'
import {
  createOfferZodSchema,
  getAllOfferQueryZodSchema,
  getOfferParamZodSchema,
  updateOfferZodSchema,
} from './offer.validation'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Offers
 *   description: Promotional offer management endpoints
 */

/**
 * @swagger
 * /offers:
 *   post:
 *     summary: Create an offer with thumbnail (admin only)
 *     tags: [Offers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *               title:
 *                 type: string
 *                 example: 50% Off Subscription
 *               description:
 *                 type: string
 *               discountPercent:
 *                 type: number
 *                 example: 50
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Offer created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Offer'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/',
  auth(userRole.admin),
  fileUploader.upload.single('thumbnail'),
  parseData,
  validateRequest(createOfferZodSchema),
  offerController.createOffer
)

/**
 * @swagger
 * /offers:
 *   get:
 *     summary: Get all offers (public)
 *     tags: [Offers]
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
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
 *         description: Offers retrieved
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
 *                         $ref: '#/components/schemas/Offer'
 */
router.get('/', validateRequest(getAllOfferQueryZodSchema), offerController.getAllOffers)

/**
 * @swagger
 * /offers/{id}:
 *   get:
 *     summary: Get a single offer by ID (public)
 *     tags: [Offers]
 *     parameters:
 *       - $ref: '#/components/schemas/UuidParam'
 *     responses:
 *       200:
 *         description: Offer retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Offer'
 *       404:
 *         description: Offer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', validateRequest(getOfferParamZodSchema), offerController.getOfferById)

/**
 * @swagger
 * /offers/{id}:
 *   patch:
 *     summary: Update an offer by ID (admin only)
 *     tags: [Offers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/schemas/UuidParam'
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               discountPercent:
 *                 type: number
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Offer updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Offer'
 */
router.patch(
  '/:id',
  auth(userRole.admin),
  fileUploader.upload.single('thumbnail'),
  parseData,
  validateRequest(getOfferParamZodSchema),
  validateRequest(updateOfferZodSchema),
  offerController.updateOfferById
)

/**
 * @swagger
 * /offers/{id}:
 *   delete:
 *     summary: Delete an offer by ID (admin only)
 *     tags: [Offers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/schemas/UuidParam'
 *     responses:
 *       200:
 *         description: Offer deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.delete(
  '/:id',
  auth(userRole.admin),
  validateRequest(getOfferParamZodSchema),
  offerController.deleteOfferById
)

export const offerRoutes = router
