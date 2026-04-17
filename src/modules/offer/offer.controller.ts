import { Request, Response } from 'express'
import catchAsync from '../../utils/catchAsync'
import pick from '../../utils/pick'
import sendResponse from '../../utils/sendResponse'
import { OfferFilterOptions, OfferPaginationOptions } from './offer.interface'
import { offerService } from './offer.service'

const createOffer = catchAsync(async (req: Request, res: Response) => {
  const file = req.file
  const payload = req.body.data ? JSON.parse(req.body.data) : req.body

  const result = await offerService.createOffer(payload, file as Express.Multer.File | undefined)

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Offer created successfully',
    data: result,
  })
})

const getOfferById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string
  const result = await offerService.getOfferById(id)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Offer retrieved successfully',
    data: result,
  })
})

const getAllOffers = catchAsync(async (req: Request, res: Response) => {
  const filterOptions = pick(req.query, ['searchTerm', 'status']) as OfferFilterOptions

  const paginationOptions = pick(req.query, [
    'page',
    'limit',
    'sortBy',
    'sortOrder',
  ]) as OfferPaginationOptions

  const result = await offerService.getAllOffers(filterOptions, paginationOptions)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All offers retrieved successfully',
    meta: result.meta,
    data: result.data,
  })
})

const updateOfferById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string
  const file = req.file
  const updateData = req.body.data ? JSON.parse(req.body.data) : req.body

  const result = await offerService.updateOfferById(
    id,
    file as Express.Multer.File | undefined,
    updateData
  )

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Offer updated successfully',
    data: result,
  })
})

const deleteOfferById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string
  const result = await offerService.deleteOfferById(id)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Offer deleted successfully',
    data: result,
  })
})

export const offerController = {
  createOffer,
  getOfferById,
  getAllOffers,
  updateOfferById,
  deleteOfferById,
}
