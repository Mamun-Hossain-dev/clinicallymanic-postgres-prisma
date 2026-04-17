import { Prisma } from '@prisma/client'
import prisma from '../../lib/prisma'

const create = async (data: Prisma.OfferCreateInput) => {
  return prisma.offer.create({
    data,
  })
}

const findById = async (id: string) => {
  return prisma.offer.findUnique({
    where: { id },
  })
}

const findMany = async (params: {
  where?: Prisma.OfferWhereInput
  orderBy?: Prisma.OfferOrderByWithRelationInput
  skip?: number
  take?: number
}) => {
  const { where, orderBy, skip, take } = params
  return prisma.offer.findMany({
    where,
    orderBy,
    skip,
    take,
  })
}

const count = async (where?: Prisma.OfferWhereInput) => {
  return prisma.offer.count({
    where,
  })
}

const update = async (id: string, data: Prisma.OfferUpdateInput) => {
  return prisma.offer.update({
    where: { id },
    data,
  })
}

const remove = async (id: string) => {
  return prisma.offer.delete({
    where: { id },
  })
}

export const offerRepository = {
  create,
  findById,
  findMany,
  count,
  update,
  remove,
}
