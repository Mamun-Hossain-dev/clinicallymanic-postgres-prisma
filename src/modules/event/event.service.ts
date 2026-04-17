import { Prisma } from '@prisma/client'
import AppError from '../../errors/AppError'
import { fileUploader } from '../../utils/fileUpload'
import pagination from '../../utils/pagination'
import { eventSearchableFields } from './event.constants'
import { EventFilterOptions, EventPaginationOptions } from './event.interface'
import { eventRepository } from './event.repository'

const createEvent = async (
  userId: string,
  payload: Omit<Prisma.EventCreateInput, 'createdBy'>,
  file: Express.Multer.File | undefined
) => {
  const finalPayload: Prisma.EventCreateInput = {
    ...payload,
    createdBy: {
      connect: { id: userId },
    },
  }

  if (file) {
    const uploaded = await fileUploader.uploadToCloudinary(file)
    if (!uploaded?.url) {
      throw new AppError(500, 'Image upload failed')
    }
    finalPayload.thumbnailUrl = uploaded.url
    finalPayload.thumbnailPublicId = uploaded.publicId
  }

  return eventRepository.create(finalPayload)
}

const getEventById = async (id: string) => {
  const event = await eventRepository.findById(id)
  if (!event) {
    throw new AppError(404, 'Event not found')
  }
  return event
}

const getAllEvents = async (
  filterOptions: EventFilterOptions,
  paginationOptions: EventPaginationOptions
) => {
  const { searchTerm, ...filterData } = filterOptions
  const { page, limit, skip, sortBy, sortOrder } = pagination(paginationOptions)

  const andConditions: Prisma.EventWhereInput[] = []

  if (searchTerm) {
    andConditions.push({
      OR: eventSearchableFields.map(field => ({
        [field]: { contains: searchTerm, mode: 'insensitive' as Prisma.QueryMode },
      })),
    })
  }

  if (Object.keys(filterData).length) {
    const filterConditions = Object.entries(filterData).reduce<Prisma.EventWhereInput[]>(
      (acc, [field, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc.push({ [field]: value })
        }
        return acc
      },
      []
    )
    if (filterConditions.length > 0) {
      andConditions.push(...filterConditions)
    }
  }

  const whereCondition: Prisma.EventWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {}

  const orderBy: Prisma.EventOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  }

  const [events, total] = await Promise.all([
    eventRepository.findMany({
      where: whereCondition,
      orderBy,
      skip,
      take: limit,
    }),
    eventRepository.count(whereCondition),
  ])

  const totalPages = Math.ceil(total / limit)

  return {
    data: events,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  }
}

const updateEventById = async (
  id: string,
  file: Express.Multer.File | undefined,
  updateData: Prisma.EventUpdateInput
) => {
  const existingEvent = await eventRepository.findById(id)
  if (!existingEvent) {
    throw new AppError(404, 'Event not found')
  }

  const finalUpdateData = { ...updateData }

  if (file) {
    if (existingEvent.thumbnailPublicId) {
      await fileUploader.deleteFromCloudinary(existingEvent.thumbnailPublicId)
    }

    const uploaded = await fileUploader.uploadToCloudinary(file)
    if (!uploaded?.url) {
      throw new AppError(500, 'Image upload failed')
    }

    finalUpdateData.thumbnailUrl = uploaded.url
    finalUpdateData.thumbnailPublicId = uploaded.publicId
  }

  return eventRepository.update(id, finalUpdateData)
}

const deleteEventById = async (id: string) => {
  const existingEvent = await eventRepository.findById(id)
  if (!existingEvent) {
    throw new AppError(404, 'Event not found')
  }

  if (existingEvent.thumbnailPublicId) {
    await fileUploader.deleteFromCloudinary(existingEvent.thumbnailPublicId)
  }

  return eventRepository.remove(id)
}

export const eventService = {
  createEvent,
  getEventById,
  getAllEvents,
  updateEventById,
  deleteEventById,
}
