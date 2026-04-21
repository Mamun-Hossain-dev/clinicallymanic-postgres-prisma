import express from 'express'
import auth from '../../middlewares/auth'
import validateRequest from '../../middlewares/validateRequest'
import { fileUploader } from '../../utils/fileUpload'
import { userRole } from '../user/user.constants'
import { eventController } from './event.controller'
import {
  createEventZodSchema,
  getAllEventQueryZodSchema,
  getEventParamZodSchema,
  updateEventZodSchema,
} from './event.validation'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event management endpoints
 */

/**
 * @swagger
 * /events:
 *   post:
 *     summary: Create a new event with thumbnail (admin only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, eventDate]
 *             properties:
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *               title:
 *                 type: string
 *                 example: Mental Health Webinar
 *               description:
 *                 type: string
 *               eventDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-08-01T10:00:00Z"
 *               location:
 *                 type: string
 *               isOnline:
 *                 type: boolean
 *                 default: false
 *               registrationLink:
 *                 type: string
 *                 format: uri
 *     responses:
 *       201:
 *         description: Event created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Event'
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
  '/',
  auth(userRole.admin),
  fileUploader.upload.single('thumbnail'),
  validateRequest(createEventZodSchema),
  eventController.createEvent
)

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Get all events (public)
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: searchTerm
 *         schema: { type: string }
 *       - in: query
 *         name: isOnline
 *         schema: { type: boolean }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [title, eventDate, createdAt] }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200:
 *         description: Events retrieved
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
 *                         $ref: '#/components/schemas/Event'
 */
router.get('/', validateRequest(getAllEventQueryZodSchema), eventController.getAllEvents)

/**
 * @swagger
 * /events/{id}:
 *   get:
 *     summary: Get a single event by ID (public)
 *     tags: [Events]
 *     parameters:
 *       - $ref: '#/components/schemas/UuidParam'
 *     responses:
 *       200:
 *         description: Event retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Event'
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', validateRequest(getEventParamZodSchema), eventController.getEventById)

/**
 * @swagger
 * /events/{id}:
 *   patch:
 *     summary: Update an event by ID (admin only)
 *     tags: [Events]
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
 *               eventDate:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               isOnline:
 *                 type: boolean
 *               registrationLink:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Event updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Event'
 */
router.patch(
  '/:id',
  auth(userRole.admin),
  fileUploader.upload.single('thumbnail'),
  validateRequest(getEventParamZodSchema),
  validateRequest(updateEventZodSchema),
  eventController.updateEventById
)

/**
 * @swagger
 * /events/{id}:
 *   delete:
 *     summary: Delete an event by ID (admin only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/schemas/UuidParam'
 *     responses:
 *       200:
 *         description: Event deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.delete(
  '/:id',
  auth(userRole.admin),
  validateRequest(getEventParamZodSchema),
  eventController.deleteEventById
)

export const eventRoutes = router
