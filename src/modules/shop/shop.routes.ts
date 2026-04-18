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

const parseJsonBody = (req: Request, res: Response, next: NextFunction) => {
  if (typeof req.body.data === 'string') {
    req.body = JSON.parse(req.body.data)
  }

  next()
}

router.get(
  '/products',
  validateRequest(getAllShopProductQueryZodSchema),
  shopController.getAllShopProducts
)

router.post(
  '/products',
  auth(userRole.admin),
  fileUploader.upload.array('images'),
  parseJsonBody,
  validateRequest(createShopProductZodSchema),
  shopController.createShopProduct
)

router.get(
  '/products/:id',
  validateRequest(getShopProductParamZodSchema),
  shopController.getShopProductById
)

router.patch(
  '/products/:id',
  auth(userRole.admin),
  fileUploader.upload.array('images'),
  parseJsonBody,
  validateRequest(getShopProductParamZodSchema),
  validateRequest(updateShopProductZodSchema),
  shopController.updateShopProductById
)

router.delete(
  '/products/:id',
  auth(userRole.admin),
  validateRequest(getShopProductParamZodSchema),
  shopController.deleteShopProductById
)

router.post(
  '/products/:id/checkout',
  auth(userRole.user),
  validateRequest(checkoutShopProductZodSchema),
  shopController.checkoutShopProduct
)

router.get(
  '/orders',
  auth(userRole.admin, userRole.user),
  validateRequest(getAllShopOrderQueryZodSchema),
  shopController.getAllShopOrders
)

router.patch(
  '/orders/:id/status',
  auth(userRole.admin),
  validateRequest(updateShopOrderStatusZodSchema),
  shopController.updateShopOrderStatus
)

export const shopRoutes = router
