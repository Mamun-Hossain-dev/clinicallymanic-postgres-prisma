import { Prisma } from '@prisma/client'
import AppError from '../../errors/AppError'
import logger from '../../utils/logger'
import pagination from '../../utils/pagination'
import sendMailer from '../../utils/sendMailer'
import { newsletterSearchableFields } from './newsletter.constants'
import {
  BroadcastNewsletterInput,
  NewsletterFilterOptions,
  NewsletterPaginationOptions,
} from './newsletter.interface'
import { newsletterRepository } from './newsletter.repository'

const createNewsletter = async (payload: Prisma.NewsletterCreateInput) => {
  const existing = await newsletterRepository.findByEmail(payload.email)
  if (existing) {
    throw new AppError(409, 'Email already subscribed')
  }
  return newsletterRepository.create(payload)
}

const getNewsletterById = async (id: string) => {
  const newsletter = await newsletterRepository.findById(id)
  if (!newsletter) {
    throw new AppError(404, 'Newsletter subscriber not found')
  }
  return newsletter
}

const getAllNewsletters = async (
  filterOptions: NewsletterFilterOptions,
  paginationOptions: NewsletterPaginationOptions
) => {
  const { searchTerm, ...filterData } = filterOptions
  const { page, limit, skip, sortBy, sortOrder } = pagination(paginationOptions)

  const andConditions: Prisma.NewsletterWhereInput[] = []

  if (searchTerm) {
    andConditions.push({
      OR: newsletterSearchableFields.map(field => ({
        [field]: { contains: searchTerm, mode: 'insensitive' as Prisma.QueryMode },
      })),
    })
  }

  if (Object.keys(filterData).length) {
    const filterConditions = Object.entries(filterData).reduce<Prisma.NewsletterWhereInput[]>(
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

  const whereCondition: Prisma.NewsletterWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {}

  const orderBy: Prisma.NewsletterOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  }

  const [newsletters, total] = await Promise.all([
    newsletterRepository.findMany({
      where: whereCondition,
      orderBy,
      skip,
      take: limit,
    }),
    newsletterRepository.count(whereCondition),
  ])

  const totalPages = Math.ceil(total / limit)

  return {
    data: newsletters,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  }
}

const updateNewsletterById = async (id: string, updateData: Prisma.NewsletterUpdateInput) => {
  const existing = await newsletterRepository.findById(id)
  if (!existing) {
    throw new AppError(404, 'Newsletter subscriber not found')
  }
  return newsletterRepository.update(id, updateData)
}

const deleteNewsletterById = async (id: string) => {
  const existing = await newsletterRepository.findById(id)
  if (!existing) {
    throw new AppError(404, 'Newsletter subscriber not found')
  }
  return newsletterRepository.remove(id)
}

const broadcastNewsletter = async (payload: BroadcastNewsletterInput) => {
  const subscribers = await newsletterRepository.findAllEmails()
  if (!subscribers.length) {
    throw new AppError(404, 'No newsletter subscribers found')
  }

  const results = await Promise.allSettled(
    subscribers.map(sub => sendMailer(sub.email, payload.subject, payload.html))
  )

  const failed = results.filter(r => r.status === 'rejected').length
  const sentCount = subscribers.length - failed

  if (failed > 0) {
    logger.error(`Newsletter broadcast: ${failed}/${subscribers.length} emails failed`)
  }

  return {
    total: subscribers.length,
    sentCount,
    failedCount: failed,
  }
}

export const newsletterService = {
  createNewsletter,
  getNewsletterById,
  getAllNewsletters,
  updateNewsletterById,
  deleteNewsletterById,
  broadcastNewsletter,
}
