import { Request, Response } from 'express'
import catchAsync from '../../utils/catchAsync'
import pick from '../../utils/pick'
import sendResponse from '../../utils/sendResponse'
import { NewsletterFilterOptions, NewsletterPaginationOptions } from './newsletter.interface'
import { newsletterService } from './newsletter.service'

const createNewsletter = catchAsync(async (req: Request, res: Response) => {
  const result = await newsletterService.createNewsletter(req.body)

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Newsletter subscription created successfully',
    data: result,
  })
})

const getNewsletterById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string
  const result = await newsletterService.getNewsletterById(id)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Newsletter subscriber retrieved successfully',
    data: result,
  })
})

const getAllNewsletters = catchAsync(async (req: Request, res: Response) => {
  const filterOptions = pick(req.query, ['searchTerm', 'email']) as NewsletterFilterOptions

  const paginationOptions = pick(req.query, [
    'page',
    'limit',
    'sortBy',
    'sortOrder',
  ]) as NewsletterPaginationOptions

  const result = await newsletterService.getAllNewsletters(filterOptions, paginationOptions)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All newsletter subscribers retrieved successfully',
    meta: result.meta,
    data: result.data,
  })
})

const updateNewsletterById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string
  const result = await newsletterService.updateNewsletterById(id, req.body)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Newsletter subscriber updated successfully',
    data: result,
  })
})

const deleteNewsletterById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string
  const result = await newsletterService.deleteNewsletterById(id)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Newsletter subscriber deleted successfully',
    data: result,
  })
})

const broadcastNewsletter = catchAsync(async (req: Request, res: Response) => {
  const result = await newsletterService.broadcastNewsletter(req.body)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Newsletter broadcast completed',
    data: result,
  })
})

export const newsletterController = {
  createNewsletter,
  getNewsletterById,
  getAllNewsletters,
  updateNewsletterById,
  deleteNewsletterById,
  broadcastNewsletter,
}
