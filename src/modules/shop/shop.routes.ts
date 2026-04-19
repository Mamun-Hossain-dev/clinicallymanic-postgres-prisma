import { NextFunction, Request, Response, Router } from 'express'
import auth from '../../middlewares/auth'
import validateRequest from '../../middlewares/validateRequest'
import { fileUploader } from '../../utils/fileUpload'
import { userRole } from '../user/user.constants'
import { shopController } from './shop.controller'
import {
  checkoutShopProductZodSchema,
  createShopProductZodSchema,
  getAllShopOrderQueryZodSchema,
  getAllShopProductQueryZodSchema,
  getShopProductParamZodSchema,
  updateShopOrderStatusZodSchema,
  updateShopProductZodSchema,
} from './shop.validation'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Shop
 *   description: Shop products and orders endpoints
 */

const parseJsonBody = (req: Request, res: Response, next: NextFunction) => {
  if (typeof req.body.data === 'string') {
    req.body = JSON.parse(req.body.data)
  }

  next()
}

/**
 * @swagger
 * /shop/products:
 *   get:
 *     summary: Get all shop products (public)
 *     tags: [Shop]
 *     parameters:
 *       - in: query
 *         name: searchTerm
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [name, price, createdAt] }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200:
 *         description: Products retrieved
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
 *                         $ref: '#/components/schemas/ShopProduct'
 */
router.get(
  '/products',
  validateRequest(getAllShopProductQueryZodSchema),
  shopController.getAllShopProducts
)

/**
 * @swagger
 * /shop/products:
 *   post:
 *     summary: Create a shop product with images (admin only)
 *     tags: [Shop]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [data]
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Product images (multiple allowed)
 *               data:
 *                 type: string
 *                 description: JSON string of product data
 *                 example: '{"name":"Anxiety Relief Kit","description":"A curated kit","price":29.99,"stock":100}'
 *     responses:
 *       201:
 *         description: Product created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ShopProduct'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/products',
  auth(userRole.admin),
  fileUploader.upload.array('images'),
  parseJsonBody,
  validateRequest(createShopProductZodSchema),
  shopController.createShopProduct
)

/**
 * @swagger
 * /shop/products/{id}:
 *   get:
 *     summary: Get a shop product by ID (public)
 *     tags: [Shop]
 *     parameters:
 *       - $ref: '#/components/schemas/UuidParam'
 *     responses:
 *       200:
 *         description: Product retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ShopProduct'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/products/:id',
  validateRequest(getShopProductParamZodSchema),
  shopController.getShopProductById
)

/**
 * @swagger
 * /shop/products/{id}:
 *   patch:
 *     summary: Update a shop product by ID (admin only)
 *     tags: [Shop]
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
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               data:
 *                 type: string
 *                 description: JSON string of updated product fields
 *     responses:
 *       200:
 *         description: Product updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ShopProduct'
 */
router.patch(
  '/products/:id',
  auth(userRole.admin),
  fileUploader.upload.array('images'),
  parseJsonBody,
  validateRequest(getShopProductParamZodSchema),
  validateRequest(updateShopProductZodSchema),
  shopController.updateShopProductById
)

/**
 * @swagger
 * /shop/products/{id}:
 *   delete:
 *     summary: Delete a shop product by ID (admin only)
 *     tags: [Shop]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/schemas/UuidParam'
 *     responses:
 *       200:
 *         description: Product deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.delete(
  '/products/:id',
  auth(userRole.admin),
  validateRequest(getShopProductParamZodSchema),
  shopController.deleteShopProductById
)

/**
 * @swagger
 * /shop/products/{id}/checkout:
 *   post:
 *     summary: Checkout a shop product (authenticated users only)
 *     tags: [Shop]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/schemas/UuidParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity, shippingAddress]
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 2
 *               shippingAddress:
 *                 type: string
 *                 example: 123 Main St, Dhaka, Bangladesh
 *     responses:
 *       200:
 *         description: Checkout successful — Stripe payment intent created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         clientSecret:
 *                           type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/products/:id/checkout',
  auth(userRole.user),
  validateRequest(checkoutShopProductZodSchema),
  shopController.checkoutShopProduct
)

/**
 * @swagger
 * /shop/orders:
 *   get:
 *     summary: Get all shop orders (admin and user)
 *     tags: [Shop]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
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
 *         description: Orders retrieved
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
 *                         type: object
 */
router.get(
  '/orders',
  auth(userRole.admin, userRole.user),
  validateRequest(getAllShopOrderQueryZodSchema),
  shopController.getAllShopOrders
)

/**
 * @swagger
 * /shop/orders/{id}/status:
 *   patch:
 *     summary: Update shop order status (admin only)
 *     tags: [Shop]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/schemas/UuidParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled]
 *                 example: shipped
 *     responses:
 *       200:
 *         description: Order status updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.patch(
  '/orders/:id/status',
  auth(userRole.admin),
  validateRequest(updateShopOrderStatusZodSchema),
  shopController.updateShopOrderStatus
)

export const shopRoutes = router
