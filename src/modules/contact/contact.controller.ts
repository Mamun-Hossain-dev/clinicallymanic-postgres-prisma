import { Request, Response } from 'express'
import catchAsync from '../../utils/catchAsync'
import pick from '../../utils/pick'
import sendResponse from '../../utils/sendResponse'
import { ContactFilterOptions, ContactPaginationOptions } from './contact.interface'
import { contactService } from './contact.service'

const createContact = catchAsync(async (req: Request, res: Response) => {
  const result = await contactService.createContact(req.body)

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Contact created successfully',
    data: result,
  })
})

const getContactById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string
  const result = await contactService.getContactById(id)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Contact retrieved successfully',
    data: result,
  })
})

const getAllContacts = catchAsync(async (req: Request, res: Response) => {
  const filterOptions = pick(req.query, [
    'searchTerm',
    'name',
    'email',
    'phoneNumber',
    'subject',
    'isRead',
  ]) as ContactFilterOptions

  const paginationOptions = pick(req.query, [
    'page',
    'limit',
    'sortBy',
    'sortOrder',
  ]) as ContactPaginationOptions

  const result = await contactService.getAllContacts(filterOptions, paginationOptions)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All contacts retrieved successfully',
    meta: result.meta,
    data: result.data,
  })
})

const updateContactById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string
  const result = await contactService.updateContactById(id, req.body)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Contact updated successfully',
    data: result,
  })
})

const deleteContactById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string
  const result = await contactService.deleteContactById(id)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Contact deleted successfully',
    data: result,
  })
})

export const contactController = {
  createContact,
  getContactById,
  getAllContacts,
  updateContactById,
  deleteContactById,
}
