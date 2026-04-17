import { Request, Response } from 'express'
import catchAsync from '../../utils/catchAsync'
import pick from '../../utils/pick'
import sendResponse from '../../utils/sendResponse'
import { ContentFilterOptions, ContentPaginationOptions } from './content.interface'
import { contentService } from './content.service'

const createContent = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string
  const file = req.file
  const payload = req.body.data ? JSON.parse(req.body.data) : req.body

  const result = await contentService.createContent(
    userId,
    payload,
    file as Express.Multer.File | undefined
  )

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Content created successfully',
    data: result,
  })
})

const getContentById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string
  const result = await contentService.getContentById(id)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Content retrieved successfully',
    data: result,
  })
})

const getAllContents = catchAsync(async (req: Request, res: Response) => {
  const filterOptions = pick(req.query, [
    'searchTerm',
    'type',
    'category',
  ]) as ContentFilterOptions

  const paginationOptions = pick(req.query, [
    'page',
    'limit',
    'sortBy',
    'sortOrder',
  ]) as ContentPaginationOptions

  const result = await contentService.getAllContents(filterOptions, paginationOptions)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All contents retrieved successfully',
    meta: result.meta,
    data: result.data,
  })
})

const updateContentById = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string
  const userRoleValue = req.user?.role as string
  const id = req.params.id as string
  const file = req.file
  const updateData = req.body.data ? JSON.parse(req.body.data) : req.body

  const result = await contentService.updateContentById(
    userId,
    userRoleValue,
    id,
    file as Express.Multer.File | undefined,
    updateData
  )

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Content updated successfully',
    data: result,
  })
})

const deleteContentById = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string
  const userRoleValue = req.user?.role as string
  const id = req.params.id as string
  const result = await contentService.deleteContentById(userId, userRoleValue, id)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Content deleted successfully',
    data: result,
  })
})

export const contentController = {
  createContent,
  getContentById,
  getAllContents,
  updateContentById,
  deleteContentById,
}
