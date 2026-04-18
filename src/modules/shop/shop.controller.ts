import { Request, Response } from 'express'
import { ShopOrderStatus } from '@prisma/client'
import catchAsync from '../../utils/catchAsync'
import pick from '../../utils/pick'
import sendResponse from '../../utils/sendResponse'
import { ShopOrderFilterOptions, ShopOrderPaginationOptions } from './shop.interface'
import { ShopProductFilterOptions, ShopProductPaginationOptions } from './shop.interface'
import { shopService } from './shop.service'

const createShopProduct = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string
  const files = req.files as Express.Multer.File[] | undefined
  const result = await shopService.createShopProduct(userId, req.body, files)

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Shop product created successfully',
    data: result,
  })
})

const getShopProductById = catchAsync(async (req: Request, res: Response) => {
  const result = await shopService.getShopProductById(req.params.id as string)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Shop product retrieved successfully',
    data: result,
  })
})

const getAllShopProducts = catchAsync(async (req: Request, res: Response) => {
  const filterOptions = pick(req.query, [
    'searchTerm',
    'category',
    'type',
    'status',
  ]) as ShopProductFilterOptions
  const paginationOptions = pick(req.query, [
    'page',
    'limit',
    'sortBy',
    'sortOrder',
  ]) as ShopProductPaginationOptions

  const result = await shopService.getAllShopProducts(filterOptions, paginationOptions)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Shop products retrieved successfully',
    meta: result.meta,
    data: result.data,
  })
})

const updateShopProductById = catchAsync(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[] | undefined
  const result = await shopService.updateShopProductById(req.params.id as string, req.body, files)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Shop product updated successfully',
    data: result,
  })
})

const deleteShopProductById = catchAsync(async (req: Request, res: Response) => {
  const result = await shopService.deleteShopProductById(req.params.id as string)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Shop product deleted successfully',
    data: result,
  })
})

const checkoutShopProduct = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string
  const result = await shopService.checkoutShopProduct(userId, req.params.id as string, req.body)

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Shop checkout session created successfully',
    data: result,
  })
})

const getAllShopOrders = catchAsync(async (req: Request, res: Response) => {
  const requester = {
    id: req.user?.id as string,
    role: req.user?.role as string,
  }
  const filterOptions = pick(req.query, [
    'searchTerm',
    'status',
    'productId',
    'userId',
  ]) as ShopOrderFilterOptions
  const paginationOptions = pick(req.query, [
    'page',
    'limit',
    'sortBy',
    'sortOrder',
  ]) as ShopOrderPaginationOptions

  const result = await shopService.getAllShopOrders(requester, filterOptions, paginationOptions)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Shop orders retrieved successfully',
    meta: result.meta,
    data: result.data,
  })
})

const updateShopOrderStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await shopService.updateShopOrderStatus(
    req.params.id as string,
    req.body.status as ShopOrderStatus
  )

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Shop order status updated successfully',
    data: result,
  })
})

export const shopController = {
  createShopProduct,
  getShopProductById,
  getAllShopProducts,
  updateShopProductById,
  deleteShopProductById,
  checkoutShopProduct,
  getAllShopOrders,
  updateShopOrderStatus,
}
