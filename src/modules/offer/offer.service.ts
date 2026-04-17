import { Prisma } from '@prisma/client'
import AppError from '../../errors/AppError'
import { fileUploader } from '../../utils/fileUpload'
import pagination from '../../utils/pagination'
import { offerSearchableFields } from './offer.constants'
import { OfferFilterOptions, OfferPaginationOptions } from './offer.interface'
import { offerRepository } from './offer.repository'

const createOffer = async (
  payload: Prisma.OfferCreateInput,
  file: Express.Multer.File | undefined
) => {
  const finalPayload = { ...payload }

  if (file) {
    const uploaded = await fileUploader.uploadToCloudinary(file)
    if (!uploaded?.url) {
      throw new AppError(500, 'Image upload failed')
    }
    finalPayload.thumbnailUrl = uploaded.url
    finalPayload.thumbnailPublicId = uploaded.publicId
  }

  return offerRepository.create(finalPayload)
}

const getOfferById = async (id: string) => {
  const offer = await offerRepository.findById(id)
  if (!offer) {
    throw new AppError(404, 'Offer not found')
  }
  return offer
}

const getAllOffers = async (
  filterOptions: OfferFilterOptions,
  paginationOptions: OfferPaginationOptions
) => {
  const { searchTerm, ...filterData } = filterOptions
  const { page, limit, skip, sortBy, sortOrder } = pagination(paginationOptions)

  const andConditions: Prisma.OfferWhereInput[] = []

  if (searchTerm) {
    andConditions.push({
      OR: offerSearchableFields.map(field => ({
        [field]: { contains: searchTerm, mode: 'insensitive' as Prisma.QueryMode },
      })),
    })
  }

  if (Object.keys(filterData).length) {
    const filterConditions = Object.entries(filterData as Record<string, unknown>).reduce<
      Prisma.OfferWhereInput[]
    >((acc, [field, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc.push({ [field]: value })
      }
      return acc
    }, [])
    if (filterConditions.length > 0) {
      andConditions.push(...filterConditions)
    }
  }

  const whereCondition: Prisma.OfferWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {}

  const orderBy: Prisma.OfferOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  }

  const [offers, total] = await Promise.all([
    offerRepository.findMany({
      where: whereCondition,
      orderBy,
      skip,
      take: limit,
    }),
    offerRepository.count(whereCondition),
  ])

  const totalPages = Math.ceil(total / limit)

  return {
    data: offers,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  }
}

const updateOfferById = async (
  id: string,
  file: Express.Multer.File | undefined,
  updateData: Prisma.OfferUpdateInput
) => {
  const existingOffer = await offerRepository.findById(id)
  if (!existingOffer) {
    throw new AppError(404, 'Offer not found')
  }

  const finalUpdateData = { ...updateData }

  if (file) {
    if (existingOffer.thumbnailPublicId) {
      await fileUploader.deleteFromCloudinary(existingOffer.thumbnailPublicId)
    }

    const uploaded = await fileUploader.uploadToCloudinary(file)
    if (!uploaded?.url) {
      throw new AppError(500, 'Image upload failed')
    }

    finalUpdateData.thumbnailUrl = uploaded.url
    finalUpdateData.thumbnailPublicId = uploaded.publicId
  }

  return offerRepository.update(id, finalUpdateData)
}

const deleteOfferById = async (id: string) => {
  const existingOffer = await offerRepository.findById(id)
  if (!existingOffer) {
    throw new AppError(404, 'Offer not found')
  }

  if (existingOffer.thumbnailPublicId) {
    await fileUploader.deleteFromCloudinary(existingOffer.thumbnailPublicId)
  }

  return offerRepository.remove(id)
}

export const offerService = {
  createOffer,
  getOfferById,
  getAllOffers,
  updateOfferById,
  deleteOfferById,
}
