import { Request, Response } from 'express'
import pick from '../../utils/pick'
import catchAsync from '../../utils/catchAsync'
import sendResponse from '../../utils/sendResponse'
import { bannerService } from './banner.service'
import { BannerFilterOptions, BannerPaginationOptions } from './banner.interface'

const createBanner = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string
  const file = req.file
  const payload = req.body

  const result = await bannerService.createBanner(userId, payload, file as Express.Multer.File)

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Banner created successfully',
    data: result,
  })
})

const getBannerById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string
  const result = await bannerService.getBannerById(id)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Banner retrieved successfully',
    data: result,
  })
})

const getAllBanners = catchAsync(async (req: Request, res: Response) => {
  const filterOptions = pick(req.query, ['searchTerm', 'category', 'status']) as BannerFilterOptions

  const paginationOptions = pick(req.query, [
    'page',
    'limit',
    'sortBy',
    'sortOrder',
  ]) as BannerPaginationOptions

  const result = await bannerService.getAllBanners(filterOptions, paginationOptions)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All banners retrieved successfully',
    meta: result.meta,
    data: result.data,
  })
})

const updateBannerById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string
  const file = req.file
  const updateData = req.body

  const result = await bannerService.updateBannerById(id, file as Express.Multer.File, updateData)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Banner updated successfully',
    data: result,
  })
})

const deleteBannerById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string

  const result = await bannerService.deleteBannerById(id)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Banner deleted successfully',
    data: result,
  })
})

export const bannerController = {
  createBanner,
  getBannerById,
  getAllBanners,
  updateBannerById,
  deleteBannerById,
}
