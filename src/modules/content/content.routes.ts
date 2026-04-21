import express from 'express'
import auth from '../../middlewares/auth'
import validateRequest from '../../middlewares/validateRequest'
import { fileUploader } from '../../utils/fileUpload'
import { userRole } from '../user/user.constants'
import { contentController } from './content.controller'
import parseData from '../../middlewares/parseData'
import {
  createContentZodSchema,
  getAllContentQueryZodSchema,
  getContentParamZodSchema,
  updateContentZodSchema,
} from './content.validation'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Contents
 *   description: Content / article management endpoints
 */

/**
 * @swagger
 * /contents:
 *   post:
 *     summary: Create content with optional thumbnail (admin only)
 *     tags: [Contents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, body]
 *             properties:
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *               title:
 *                 type: string
 *                 example: Understanding Anxiety
 *               body:
 *                 type: string
 *                 example: Anxiety is a natural response to stress...
 *               category:
 *                 type: string
 *                 example: Mental Health
 *               isPublished:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Content created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Content'
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
  validateRequest(createContentZodSchema),
  contentController.createContent
)

/**
 * @swagger
 * /contents:
 *   get:
 *     summary: Get all content (public)
 *     tags: [Contents]
 *     parameters:
 *       - in: query
 *         name: searchTerm
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: isPublished
 *         schema: { type: boolean }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [title, createdAt, updatedAt] }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200:
 *         description: Content list retrieved
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
 *                         $ref: '#/components/schemas/Content'
 */
router.get('/', validateRequest(getAllContentQueryZodSchema), contentController.getAllContents)

/**
 * @swagger
 * /contents/{id}:
 *   get:
 *     summary: Get a single content by ID (public)
 *     tags: [Contents]
 *     parameters:
 *       - $ref: '#/components/schemas/UuidParam'
 *     responses:
 *       200:
 *         description: Content retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Content'
 *       404:
 *         description: Content not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', validateRequest(getContentParamZodSchema), contentController.getContentById)

/**
 * @swagger
 * /contents/{id}:
 *   patch:
 *     summary: Update content by ID (admin only)
 *     tags: [Contents]
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
 *               body:
 *                 type: string
 *               category:
 *                 type: string
 *               isPublished:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Content updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Content'
 */
router.patch(
  '/:id',
  auth(userRole.admin),
  fileUploader.upload.single('thumbnail'),
  parseData,
  validateRequest(getContentParamZodSchema),
  validateRequest(updateContentZodSchema),
  contentController.updateContentById
)

/**
 * @swagger
 * /contents/{id}:
 *   delete:
 *     summary: Delete content by ID (admin only)
 *     tags: [Contents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/schemas/UuidParam'
 *     responses:
 *       200:
 *         description: Content deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.delete(
  '/:id',
  auth(userRole.admin),
  validateRequest(getContentParamZodSchema),
  contentController.deleteContentById
)

export const contentRoutes = router
