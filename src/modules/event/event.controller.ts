import { Request, Response } from 'express'
import catchAsync from '../../utils/catchAsync'
import pick from '../../utils/pick'
import sendResponse from '../../utils/sendResponse'
import { EventFilterOptions, EventPaginationOptions } from './event.interface'
import { eventService } from './event.service'

const createEvent = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string
  const file = req.file
  const payload = req.body.data ? JSON.parse(req.body.data) : req.body

  const result = await eventService.createEvent(
    userId,
    payload,
    file as Express.Multer.File | undefined
  )

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Event created successfully',
    data: result,
  })
})

const getEventById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string
  const result = await eventService.getEventById(id)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Event retrieved successfully',
    data: result,
  })
})

const getAllEvents = catchAsync(async (req: Request, res: Response) => {
  const filterOptions = pick(req.query, [
    'searchTerm',
    'location',
    'status',
  ]) as EventFilterOptions

  const paginationOptions = pick(req.query, [
    'page',
    'limit',
    'sortBy',
    'sortOrder',
  ]) as EventPaginationOptions

  const result = await eventService.getAllEvents(filterOptions, paginationOptions)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All events retrieved successfully',
    meta: result.meta,
    data: result.data,
  })
})

const updateEventById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string
  const file = req.file
  const updateData = req.body.data ? JSON.parse(req.body.data) : req.body

  const result = await eventService.updateEventById(
    id,
    file as Express.Multer.File | undefined,
    updateData
  )

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Event updated successfully',
    data: result,
  })
})

const deleteEventById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string
  const result = await eventService.deleteEventById(id)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Event deleted successfully',
    data: result,
  })
})

export const eventController = {
  createEvent,
  getEventById,
  getAllEvents,
  updateEventById,
  deleteEventById,
}
