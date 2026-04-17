import { Prisma } from '@prisma/client'
import prisma from '../../lib/prisma'

const create = async (data: Prisma.NewsletterCreateInput) => {
  return prisma.newsletter.create({
    data,
  })
}

const findById = async (id: string) => {
  return prisma.newsletter.findUnique({
    where: { id },
  })
}

const findByEmail = async (email: string) => {
  return prisma.newsletter.findUnique({
    where: { email },
  })
}

const findMany = async (params: {
  where?: Prisma.NewsletterWhereInput
  orderBy?: Prisma.NewsletterOrderByWithRelationInput
  skip?: number
  take?: number
}) => {
  const { where, orderBy, skip, take } = params
  return prisma.newsletter.findMany({
    where,
    orderBy,
    skip,
    take,
  })
}

const findAllEmails = async () => {
  return prisma.newsletter.findMany({
    select: { email: true },
  })
}

const count = async (where?: Prisma.NewsletterWhereInput) => {
  return prisma.newsletter.count({
    where,
  })
}

const update = async (id: string, data: Prisma.NewsletterUpdateInput) => {
  return prisma.newsletter.update({
    where: { id },
    data,
  })
}

const remove = async (id: string) => {
  return prisma.newsletter.delete({
    where: { id },
  })
}

export const newsletterRepository = {
  create,
  findById,
  findByEmail,
  findMany,
  findAllEmails,
  count,
  update,
  remove,
}
