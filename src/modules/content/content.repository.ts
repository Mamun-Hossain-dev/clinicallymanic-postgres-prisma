import { Prisma } from '@prisma/client'
import prisma from '../../lib/prisma'

const create = async (data: Prisma.ContentCreateInput) => {
  return prisma.content.create({
    data,
    include: {
      createdBy: true,
    },
  })
}

const findById = async (id: string) => {
  return prisma.content.findUnique({
    where: { id },
    include: {
      createdBy: true,
    },
  })
}

const findMany = async (params: {
  where?: Prisma.ContentWhereInput
  orderBy?: Prisma.ContentOrderByWithRelationInput
  skip?: number
  take?: number
}) => {
  const { where, orderBy, skip, take } = params
  return prisma.content.findMany({
    where,
    orderBy,
    skip,
    take,
    include: {
      createdBy: true,
    },
  })
}

const count = async (where?: Prisma.ContentWhereInput) => {
  return prisma.content.count({
    where,
  })
}

const update = async (id: string, data: Prisma.ContentUpdateInput) => {
  return prisma.content.update({
    where: { id },
    data,
    include: {
      createdBy: true,
    },
  })
}

const remove = async (id: string) => {
  return prisma.content.delete({
    where: { id },
  })
}

export const contentRepository = {
  create,
  findById,
  findMany,
  count,
  update,
  remove,
}
