import { Prisma } from '@prisma/client'
import AppError from '../../errors/AppError'
import { fileUploader } from '../../utils/fileUpload'
import pagination from '../../utils/pagination'
import { BannerFilterOptions, BannerPaginationOptions } from './banner.interface'
import { bannerRepository } from './banner.repository'
import { bannerSearchableFields } from './banner.constants'

const createBanner = async (
  userId: string,
  payload: Omit<Prisma.BannerCreateInput, 'createdBy'>,
  file: Express.Multer.File
) => {
  if (!file) {
    throw new AppError(400, 'Image file is required')
  }

  const bannerFile = await fileUploader.uploadToCloudinary(file)
  if (!bannerFile?.url) {
    throw new AppError(500, 'Image upload failed')
  }

  const result = await bannerRepository.create({
    ...payload,
    bannerImageUrl: bannerFile.url,
    bannerImagePublicId: bannerFile.publicId,
    createdBy: {
      connect: { id: userId },
    },
  })

  return result
}

const getBannerById = async (id: string) => {
  const banner = await bannerRepository.findByIdWithCreator(id)
  if (!banner) {
    throw new AppError(404, 'Banner not found')
  }
  return banner
}

const getAllBanners = async (
  filterOptions: BannerFilterOptions,
  paginationOptions: BannerPaginationOptions
) => {
  const { searchTerm, ...filterData } = filterOptions
  const { page, limit, skip, sortBy, sortOrder } = pagination(paginationOptions)

  const andConditions: Prisma.BannerWhereInput[] = []

  // Search term condition
  if (searchTerm) {
    andConditions.push({
      OR: bannerSearchableFields.map(field => ({
        [field]: { contains: searchTerm, mode: 'insensitive' as Prisma.QueryMode },
      })),
    })
  }

  // Filter conditions
  if (Object.keys(filterData).length) {
    const filterConditions = Object.entries(filterData).reduce<Prisma.BannerWhereInput[]>(
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

  const whereCondition: Prisma.BannerWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {}

  const orderBy: Prisma.BannerOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  }

  const [banners, total] = await Promise.all([
    bannerRepository.findMany({
      where: whereCondition,
      orderBy,
      skip,
      take: limit,
    }),
    bannerRepository.count(whereCondition),
  ])

  const totalPages = Math.ceil(total / limit)

  return {
    data: banners,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  }
}

const updateBannerById = async (
  id: string,
  file: Express.Multer.File | undefined,
  updateData: Prisma.BannerUpdateInput
) => {
  const existingBanner = await bannerRepository.findById(id)
  if (!existingBanner) {
    throw new AppError(404, 'Banner not found')
  }

  let finalUpdateData = { ...updateData }

  if (file) {
    // Delete old image from Cloudinary if exists
    if (existingBanner.bannerImagePublicId) {
      await fileUploader.deleteFromCloudinary(existingBanner.bannerImagePublicId)
    }

    const bannerFile = await fileUploader.uploadToCloudinary(file)
    if (!bannerFile?.url) {
      throw new AppError(500, 'Image upload failed')
    }

    finalUpdateData.bannerImageUrl = bannerFile.url
    finalUpdateData.bannerImagePublicId = bannerFile.publicId
  }

  return bannerRepository.update(id, finalUpdateData)
}

const deleteBannerById = async (id: string) => {
  const existingBanner = await bannerRepository.findById(id)
  if (!existingBanner) {
    throw new AppError(404, 'Banner not found')
  }

  // Delete image from Cloudinary if exists
  if (existingBanner.bannerImagePublicId) {
    await fileUploader.deleteFromCloudinary(existingBanner.bannerImagePublicId)
  }

  return bannerRepository.remove(id)
}

export const bannerService = {
  createBanner,
  getBannerById,
  getAllBanners,
  updateBannerById,
  deleteBannerById,
}
