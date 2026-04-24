import { Prisma } from '@prisma/client'
import AppError from '../../errors/AppError'
import { fileUploader } from '../../utils/fileUpload'
import pagination from '../../utils/pagination'
import { cacheDel, cacheGet, cacheSet } from '../../utils/chache'
import logger from '../../utils/logger'
import { BannerFilterOptions, BannerPaginationOptions } from './banner.interface'
import { bannerRepository } from './banner.repository'
import { bannerSearchableFields } from './banner.constants'

const BANNER_CACHE_TTL = 60  * 5 // 5 minutes
const BANNER_VERSION_TTL = 60 * 60 * 24 * 30 // 30 days
const BANNER_LIST_VERSION_KEY = 'banner:list:version'

const cacheKey = {
  byId: (id: string) => `banner:id:${id}`,
  list: (version: string, payload: object) =>
  `banner:list:v${version}:${JSON.stringify(payload)}`
}

const getBannerListVersion = async () => {
  const version = await cacheGet<string>(BANNER_LIST_VERSION_KEY)

  if (version !== null) {
    return version
  }

  const initialVersion = '1'
  await cacheSet(BANNER_LIST_VERSION_KEY, initialVersion, BANNER_VERSION_TTL)
  return initialVersion
}

const invalidateBannerLists = async () =>
  cacheSet(BANNER_LIST_VERSION_KEY, Date.now().toString(), BANNER_VERSION_TTL)

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

  await invalidateBannerLists()

  return result
}

const getBannerById = async (id: string) => {
  const startedAt = Date.now()
  const cachedBanner = await cacheGet<Awaited<ReturnType<typeof bannerRepository.findByIdWithCreator>>>(
    cacheKey.byId(id)
  )

  if (cachedBanner) {
    logger.info(`[banner-cache] hit key=${cacheKey.byId(id)} totalMs=${Date.now() - startedAt}`)
    return cachedBanner
  }

  logger.info(`[banner-cache] miss key=${cacheKey.byId(id)}`)
  const dbStartedAt = Date.now()
  const banner = await bannerRepository.findByIdWithCreator(id)
  if (!banner) {
    throw new AppError(404, 'Banner not found')
  }

  await cacheSet(cacheKey.byId(id), banner, BANNER_CACHE_TTL)
  logger.info(
    `[banner-cache] set key=${cacheKey.byId(id)} dbMs=${Date.now() - dbStartedAt} totalMs=${Date.now() - startedAt}`
  )

  return banner
}

const getAllBanners = async (
  filterOptions: BannerFilterOptions,
  paginationOptions: BannerPaginationOptions
) => {
  const startedAt = Date.now()
  const listVersion = await getBannerListVersion()
  const listCachePayload = {
    searchTerm: filterOptions.searchTerm ?? null,
    category: filterOptions.category ?? null,
    status: filterOptions.status ?? null,
    page: paginationOptions.page ?? 1,
    limit: paginationOptions.limit ?? 10,
    sortBy: paginationOptions.sortBy ?? 'createdAt',
    sortOrder: paginationOptions.sortOrder ?? 'desc',
  }
  const listCacheKey = cacheKey.list(listVersion, listCachePayload)

  const cachedResult = await cacheGet<{
    data: Awaited<ReturnType<typeof bannerRepository.findMany>>
    meta: { total: number; page: number; limit: number; totalPages: number }
  }>(listCacheKey)

  if (cachedResult) {
    logger.info(`[banner-cache] hit key=${listCacheKey} totalMs=${Date.now() - startedAt}`)
    return cachedResult
  }

  logger.info(`[banner-cache] miss key=${listCacheKey}`)
  const dbStartedAt = Date.now()
  const { searchTerm, category, ...filterData } = filterOptions
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
  if (category) {
    andConditions.push({
      category: {
        equals: category,
        mode: 'insensitive',
      },
    })
  }

  if (Object.keys(filterData).length) {
    const filterConditions = Object.entries(filterData).reduce<Prisma.BannerWhereInput[]>(
      (acc, [field, value]) => {
        if (value !== undefined && value !== null) {
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

  const response = {
    data: banners,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  }

  await cacheSet(listCacheKey, response, BANNER_CACHE_TTL)
  logger.info(
    `[banner-cache] set key=${listCacheKey} dbMs=${Date.now() - dbStartedAt} totalMs=${Date.now() - startedAt}`
  )

  return response
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

  const updatedBanner = await bannerRepository.update(id, finalUpdateData)

  await Promise.all([cacheDel(cacheKey.byId(id)), invalidateBannerLists()])

  return updatedBanner
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

  const deletedBanner = await bannerRepository.remove(id)

  await Promise.all([cacheDel(cacheKey.byId(id)), invalidateBannerLists()])

  return deletedBanner
}

export const bannerService = {
  createBanner,
  getBannerById,
  getAllBanners,
  updateBannerById,
  deleteBannerById,
}
