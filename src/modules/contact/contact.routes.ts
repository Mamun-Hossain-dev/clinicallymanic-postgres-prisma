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

/**
 * @swagger
 * tags:
 *   name: Contacts
 *   description: Contact form submissions
 */

/**
 * @swagger
 * /contacts:
 *   post:
 *     summary: Submit a contact form (public)
 *     tags: [Contacts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, subject, message]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jane Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jane@example.com
 *               subject:
 *                 type: string
 *                 example: General Inquiry
 *               message:
 *                 type: string
 *                 example: I have a question about your services.
 *     responses:
 *       201:
 *         description: Contact message submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Contact'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', validateRequest(createContactZodSchema), contactController.createContact)

/**
 * @swagger
 * /contacts:
 *   get:
 *     summary: Get all contact submissions (admin only)
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *       - in: query
 *         name: isRead
 *         schema: { type: boolean }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200:
 *         description: Contacts retrieved
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
 *                         $ref: '#/components/schemas/Contact'
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
router.get(
  '/',
  auth(userRole.admin),
  validateRequest(getAllContactQueryZodSchema),
  contactController.getAllContacts
)

/**
 * @swagger
 * /contacts/{id}:
 *   get:
 *     summary: Get a contact submission by ID (admin only)
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/schemas/UuidParam'
 *     responses:
 *       200:
 *         description: Contact retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Contact'
 *       404:
 *         description: Contact not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/:id',
  auth(userRole.admin),
  validateRequest(getContactParamZodSchema),
  contactController.getContactById
)

/**
 * @swagger
 * /contacts/{id}:
 *   patch:
 *     summary: Update a contact submission by ID (admin only)
 *     tags: [Contacts]
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
 *               isRead:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Contact updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Contact'
 */
router.patch(
  '/:id',
  auth(userRole.admin),
  validateRequest(getContactParamZodSchema),
  validateRequest(updateContactZodSchema),
  contactController.updateContactById
)

/**
 * @swagger
 * /contacts/{id}:
 *   delete:
 *     summary: Delete a contact submission (admin only)
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/schemas/UuidParam'
 *     responses:
 *       200:
 *         description: Contact deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.delete(
  '/:id',
  auth(userRole.admin),
  validateRequest(getContactParamZodSchema),
  contactController.deleteContactById
)

export const contactRoutes = router
