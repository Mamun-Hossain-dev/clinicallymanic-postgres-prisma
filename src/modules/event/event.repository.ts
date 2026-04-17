import { Prisma } from '@prisma/client'
import prisma from '../../lib/prisma'

const create = async (data: Prisma.EventCreateInput) => {
  return prisma.event.create({
    data,
  })
}

const findById = async (id: string) => {
  return prisma.event.findUnique({
    where: { id },
    include: {
      createdBy: true,
    },
  })
}

const findMany = async (params: {
  where?: Prisma.EventWhereInput
  orderBy?: Prisma.EventOrderByWithRelationInput
  skip?: number
  take?: number
}) => {
  const { where, orderBy, skip, take } = params
  return prisma.event.findMany({
    where,
    orderBy,
    skip,
    take,
    include: {
      createdBy: true,
    },
  })
}

const count = async (where?: Prisma.EventWhereInput) => {
  return prisma.event.count({
    where,
  })
}

const update = async (id: string, data: Prisma.EventUpdateInput) => {
  return prisma.event.update({
    where: { id },
    data,
    include: {
      createdBy: true,
    },
  })
}

const remove = async (id: string) => {
  return prisma.event.delete({
    where: { id },
  })
}

export const eventRepository = {
  create,
  findById,
  findMany,
  count,
  update,
  remove,
}
