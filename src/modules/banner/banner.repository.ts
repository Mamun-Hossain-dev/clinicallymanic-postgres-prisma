import { Prisma } from '@prisma/client'
import prisma from '../../lib/prisma'

const create = async (data: Prisma.BannerCreateInput) => {
  return prisma.banner.create({
    data,
  })
}

const findById = async (id: string) => {
  return prisma.banner.findUnique({
    where: { id },
    include: {
      createdBy: true,
    },
  })
}

const findMany = async (params: {
  where?: Prisma.BannerWhereInput
  orderBy?: Prisma.BannerOrderByWithRelationInput
  skip?: number
  take?: number
}) => {
  const { where, orderBy, skip, take } = params
  return prisma.banner.findMany({
    where,
    orderBy,
    skip,
    take,
    include: {
      createdBy: true,
    },
  })
}

const count = async (where?: Prisma.BannerWhereInput) => {
  return prisma.banner.count({
    where,
  })
}

const update = async (id: string, data: Prisma.BannerUpdateInput) => {
  return prisma.banner.update({
    where: { id },
    data,
    include: {
      createdBy: true,
    },
  })
}

const remove = async (id: string) => {
  return prisma.banner.delete({
    where: { id },
  })
}

const findByIdWithCreator = async (id: string) => {
  return prisma.banner.findUnique({
    where: { id },
    include: {
      createdBy: true,
    },
  })
}

export const bannerRepository = {
  create,
  findById,
  findMany,
  count,
  update,
  remove,
  findByIdWithCreator,
}
