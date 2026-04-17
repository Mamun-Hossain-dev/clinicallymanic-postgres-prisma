import { ContentType, Prisma } from '@prisma/client'
import AppError from '../../errors/AppError'
import { fileUploader } from '../../utils/fileUpload'
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

  return contentRepository.create(finalPayload)
}

const getContentById = async (id: string) => {
  const content = await contentRepository.findById(id)
  if (!content) {
    throw new AppError(404, 'Content not found')
  }
  return content
}

const getAllContents = async (
  filterOptions: ContentFilterOptions,
  paginationOptions: ContentPaginationOptions
) => {
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

  return {
    data: contents,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  }
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

  return contentRepository.update(id, finalUpdateData)
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

  return contentRepository.remove(id)
}

export const contentService = {
  createContent,
  getContentById,
  getAllContents,
  updateContentById,
  deleteContentById,
}
