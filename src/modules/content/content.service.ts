import { ContentType, Prisma } from '@prisma/client'
import AppError from '../../errors/AppError'
import { cacheDel, cacheGet, cacheSet } from '../../utils/chache'
import { fileUploader } from '../../utils/fileUpload'
import logger from '../../utils/logger'
import pagination from '../../utils/pagination'
import { userRole } from '../user/user.constants'
import { contentSearchableFields } from './content.constants'
import {
  ContentFilterOptions,
  ContentPaginationOptions,
  CreateContentInput,
  UpdateContentInput,
} from './content.interface'
import { contentRepository } from './content.repository'

const CONTENT_CACHE_TTL = 60 * 5 // 5 minutes
const CONTENT_VERSION_TTL = 60 * 60 * 24 * 30 // 30 days
const CONTENT_LIST_VERSION_KEY = 'content:list:version'

const cacheKey = {
  byId: (id: string) => `content:id:${id}`,
  list: (version: string, payload: object) => `content:list:v${version}:${JSON.stringify(payload)}`,
}

const getContentListVersion = async () => {
  const version = await cacheGet<string>(CONTENT_LIST_VERSION_KEY)
  if (version !== null) return version

  const initialVersion = '1'
  await cacheSet(CONTENT_LIST_VERSION_KEY, initialVersion, CONTENT_VERSION_TTL)
  return initialVersion
}

const invalidateContentLists = async () =>
  cacheSet(CONTENT_LIST_VERSION_KEY, Date.now().toString(), CONTENT_VERSION_TTL)

// Fields that are valid for each content type. Anything outside this set is rejected on update.
const allowedFieldsByType: Record<ContentType, ReadonlySet<keyof UpdateContentInput>> = {
  ARTICLE: new Set([
    'title',
    'description',
    'category',
    'thumbnailUrl',
    'thumbnailPublicId',
    'body',
  ]),
  YOUTUBE: new Set([
    'title',
    'description',
    'category',
    'thumbnailUrl',
    'thumbnailPublicId',
    'videoUrl',
  ]),
  SPOTIFY: new Set([
    'title',
    'description',
    'category',
    'thumbnailUrl',
    'thumbnailPublicId',
    'audioUrl',
  ]),
}

const assertFieldsMatchType = (type: ContentType, payload: UpdateContentInput) => {
  const allowed = allowedFieldsByType[type]
  const invalid = (Object.keys(payload) as (keyof UpdateContentInput)[]).filter(
    key => payload[key] !== undefined && !allowed.has(key)
  )
  if (invalid.length) {
    throw new AppError(400, `Fields not allowed for ${type}: ${invalid.join(', ')}`)
  }
}

const createContent = async (
  userId: string,
  payload: CreateContentInput,
  file: Express.Multer.File | undefined
) => {
  const finalPayload: Prisma.ContentCreateInput = {
    type: payload.type,
    title: payload.title,
    description: payload.description,
    category: payload.category,
    thumbnailUrl: payload.thumbnailUrl,
    thumbnailPublicId: payload.thumbnailPublicId,
    createdBy: { connect: { id: userId } },
  }

  if (payload.type === 'ARTICLE') {
    finalPayload.body = payload.body
  } else if (payload.type === 'YOUTUBE') {
    finalPayload.videoUrl = payload.videoUrl
  } else {
    finalPayload.audioUrl = payload.audioUrl
  }

  if (file) {
    const uploaded = await fileUploader.uploadToCloudinary(file)
    if (!uploaded?.url) {
      throw new AppError(500, 'Image upload failed')
    }
    finalPayload.thumbnailUrl = uploaded.url
    finalPayload.thumbnailPublicId = uploaded.publicId
  }

  const content = await contentRepository.create(finalPayload)
  await invalidateContentLists()

  return content
}

const getContentById = async (id: string) => {
  const startedAt = Date.now()
  const cachedContent = await cacheGet<Awaited<ReturnType<typeof contentRepository.findById>>>(
    cacheKey.byId(id)
  )

  if (cachedContent) {
    logger.info(`[content-cache] hit key=${cacheKey.byId(id)} totalMs=${Date.now() - startedAt}`)
    return cachedContent
  }

  logger.info(`[content-cache] miss key=${cacheKey.byId(id)}`)
  const dbStartedAt = Date.now()
  const content = await contentRepository.findById(id)
  if (!content) {
    throw new AppError(404, 'Content not found')
  }

  await cacheSet(cacheKey.byId(id), content, CONTENT_CACHE_TTL)
  logger.info(
    `[content-cache] set key=${cacheKey.byId(id)} dbMs=${Date.now() - dbStartedAt} totalMs=${Date.now() - startedAt}`
  )

  return content
}

const getAllContents = async (
  filterOptions: ContentFilterOptions,
  paginationOptions: ContentPaginationOptions
) => {
  const startedAt = Date.now()
  const listVersion = await getContentListVersion()
  const listCachePayload = {
    searchTerm: filterOptions.searchTerm ?? null,
    type: filterOptions.type ?? null,
    category: filterOptions.category ?? null,
    page: paginationOptions.page ?? 1,
    limit: paginationOptions.limit ?? 10,
    sortBy: paginationOptions.sortBy ?? 'createdAt',
    sortOrder: paginationOptions.sortOrder ?? 'desc',
  }
  const listCacheKey = cacheKey.list(listVersion, listCachePayload)

  const cachedResult = await cacheGet<{
    data: Awaited<ReturnType<typeof contentRepository.findMany>>
    meta: { total: number; page: number; limit: number; totalPages: number }
  }>(listCacheKey)

  if (cachedResult) {
    logger.info(`[content-cache] hit key=${listCacheKey} totalMs=${Date.now() - startedAt}`)
    return cachedResult
  }

  logger.info(`[content-cache] miss key=${listCacheKey}`)
  const dbStartedAt = Date.now()
  const { searchTerm, ...filterData } = filterOptions
  const { page, limit, skip, sortBy, sortOrder } = pagination(paginationOptions)

  const andConditions: Prisma.ContentWhereInput[] = []

  if (searchTerm) {
    andConditions.push({
      OR: contentSearchableFields.map(field => ({
        [field]: { contains: searchTerm, mode: 'insensitive' as Prisma.QueryMode },
      })),
    })
  }

  if (Object.keys(filterData).length) {
    const filterConditions = Object.entries(filterData).reduce<Prisma.ContentWhereInput[]>(
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

  const whereCondition: Prisma.ContentWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {}

  const orderBy: Prisma.ContentOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  }

  const [contents, total] = await Promise.all([
    contentRepository.findMany({
      where: whereCondition,
      orderBy,
      skip,
      take: limit,
    }),
    contentRepository.count(whereCondition),
  ])

  const totalPages = Math.ceil(total / limit)

  const response = {
    data: contents,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  }

  await cacheSet(listCacheKey, response, CONTENT_CACHE_TTL)
  logger.info(
    `[content-cache] set key=${listCacheKey} dbMs=${Date.now() - dbStartedAt} totalMs=${Date.now() - startedAt}`
  )

  return response
}

const updateContentById = async (
  userId: string,
  userRoleValue: string,
  id: string,
  file: Express.Multer.File | undefined,
  updateData: UpdateContentInput
) => {
  const existing = await contentRepository.findById(id)
  if (!existing) {
    throw new AppError(404, 'Content not found')
  }

  if (userRoleValue !== userRole.admin && existing.createdById !== userId) {
    throw new AppError(403, 'You are not authorized to update this content')
  }

  assertFieldsMatchType(existing.type, updateData)

  const finalUpdateData: Prisma.ContentUpdateInput = { ...updateData }

  if (file) {
    if (existing.thumbnailPublicId) {
      await fileUploader.deleteFromCloudinary(existing.thumbnailPublicId)
    }
    const uploaded = await fileUploader.uploadToCloudinary(file)
    if (!uploaded?.url) {
      throw new AppError(500, 'Image upload failed')
    }
    finalUpdateData.thumbnailUrl = uploaded.url
    finalUpdateData.thumbnailPublicId = uploaded.publicId
  }

  const updatedContent = await contentRepository.update(id, finalUpdateData)
  await Promise.all([cacheDel(cacheKey.byId(id)), invalidateContentLists()])

  return updatedContent
}

const deleteContentById = async (userId: string, userRoleValue: string, id: string) => {
  const existing = await contentRepository.findById(id)
  if (!existing) {
    throw new AppError(404, 'Content not found')
  }

  if (userRoleValue !== userRole.admin && existing.createdById !== userId) {
    throw new AppError(403, 'You are not authorized to delete this content')
  }

  if (existing.thumbnailPublicId) {
    await fileUploader.deleteFromCloudinary(existing.thumbnailPublicId)
  }

  const deletedContent = await contentRepository.remove(id)
  await Promise.all([cacheDel(cacheKey.byId(id)), invalidateContentLists()])

  return deletedContent
}

export const contentService = {
  createContent,
  getContentById,
  getAllContents,
  updateContentById,
  deleteContentById,
}
