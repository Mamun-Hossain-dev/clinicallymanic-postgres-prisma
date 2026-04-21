import express from 'express'
import validateRequest from '../../middlewares/validateRequest'
import { fileUploader } from '../../utils/fileUpload'
import { userController } from './user.controller'
import parseData from '../../middlewares/parseData'
import {
  createUserZodSchema,
  getAllUsersZodSchema,
  getUserParamZodSchema,
  updateUserZodSchema,
} from './user.validation'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 */

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, email, password]
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: secret123
 *               role:
 *                 type: string
 *                 enum: [ADMIN, USER, GUEST]
 *                 default: USER
 *               profileImage:
 *                 type: string
 *                 format: uri
 *               bio:
 *                 type: string
 *               phone:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', validateRequest(createUserZodSchema), userController.createUser)

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users with filtering, pagination and sorting
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: searchTerm
 *         schema:
 *           type: string
 *         description: Search across firstName, lastName, email
 *       - in: query
 *         name: firstName
 *         schema:
 *           type: string
 *       - in: query
 *         name: lastName
 *         schema:
 *           type: string
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *           format: email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [ADMIN, USER, GUEST]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [firstName, lastName, email, createdAt, updatedAt]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Users list retrieved successfully
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
 *                         $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', validateRequest(getAllUsersZodSchema), userController.getAllUsers)

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     parameters:
 *       - $ref: '#/components/schemas/UuidParam'
 *     responses:
 *       200:
 *         description: User retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', validateRequest(getUserParamZodSchema), userController.getUserById)

/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     summary: Update a user by ID
 *     tags: [Users]
 *     parameters:
 *       - $ref: '#/components/schemas/UuidParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               bio:
 *                 type: string
 *               phone:
 *                 type: string
 *               location:
 *                 type: string
 *               profileImage:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: User updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  '/:id',
  fileUploader.upload.single('profileImage'),
  parseData,
  validateRequest(getUserParamZodSchema),
  validateRequest(updateUserZodSchema),
  userController.updateUserById
)

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user by ID
 *     tags: [Users]
 *     parameters:
 *       - $ref: '#/components/schemas/UuidParam'
 *     responses:
 *       200:
 *         description: User deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id', validateRequest(getUserParamZodSchema), userController.deleteUserById)

export const userRoutes = router
