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

/**
 * @swagger
 * tags:
 *   name: Newsletters
 *   description: Newsletter subscription & broadcast endpoints
 */

/**
 * @swagger
 * /newsletters/broadcast:
 *   post:
 *     summary: Broadcast an email to all subscribers (admin only)
 *     tags: [Newsletters]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subject, body]
 *             properties:
 *               subject:
 *                 type: string
 *                 example: Monthly Health Tips
 *               body:
 *                 type: string
 *                 example: Here are this month's top mental health tips...
 *     responses:
 *       200:
 *         description: Broadcast sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden — admin only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/broadcast',
  auth(userRole.admin),
  validateRequest(broadcastNewsletterZodSchema),
  newsletterController.broadcastNewsletter
)

/**
 * @swagger
 * /newsletters:
 *   post:
 *     summary: Subscribe to newsletter (public)
 *     tags: [Newsletters]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: subscriber@example.com
 *     responses:
 *       201:
 *         description: Subscribed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Newsletter'
 *       400:
 *         description: Already subscribed or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', validateRequest(createNewsletterZodSchema), newsletterController.createNewsletter)

/**
 * @swagger
 * /newsletters:
 *   get:
 *     summary: Get all newsletter subscribers (admin only)
 *     tags: [Newsletters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isSubscribed
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
 *         description: Subscribers list retrieved
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
 *                         $ref: '#/components/schemas/Newsletter'
 */
router.get(
  '/',
  auth(userRole.admin),
  validateRequest(getAllNewsletterQueryZodSchema),
  newsletterController.getAllNewsletters
)

/**
 * @swagger
 * /newsletters/{id}:
 *   get:
 *     summary: Get a single subscriber by ID (admin only)
 *     tags: [Newsletters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/schemas/UuidParam'
 *     responses:
 *       200:
 *         description: Subscriber retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Newsletter'
 *       404:
 *         description: Subscriber not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/:id',
  auth(userRole.admin),
  validateRequest(getNewsletterParamZodSchema),
  newsletterController.getNewsletterById
)

/**
 * @swagger
 * /newsletters/{id}:
 *   patch:
 *     summary: Update a subscriber by ID (admin only)
 *     tags: [Newsletters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/schemas/UuidParam'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isSubscribed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Subscriber updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Newsletter'
 */
router.patch(
  '/:id',
  auth(userRole.admin),
  validateRequest(getNewsletterParamZodSchema),
  validateRequest(updateNewsletterZodSchema),
  newsletterController.updateNewsletterById
)

/**
 * @swagger
 * /newsletters/{id}:
 *   delete:
 *     summary: Delete a subscriber by ID (admin only)
 *     tags: [Newsletters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/schemas/UuidParam'
 *     responses:
 *       200:
 *         description: Subscriber deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.delete(
  '/:id',
  auth(userRole.admin),
  validateRequest(getNewsletterParamZodSchema),
  newsletterController.deleteNewsletterById
)

export const newsletterRoutes = router
