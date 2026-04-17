import { Prisma } from '@prisma/client'
import prisma from '../../lib/prisma'

const create = async (data: Prisma.ContactCreateInput) => {
  return prisma.contact.create({
    data,
  })
}

const findById = async (id: string) => {
  return prisma.contact.findUnique({
    where: { id },
  })
}

const findMany = async (params: {
  where?: Prisma.ContactWhereInput
  orderBy?: Prisma.ContactOrderByWithRelationInput
  skip?: number
  take?: number
}) => {
  const { where, orderBy, skip, take } = params
  return prisma.contact.findMany({
    where,
    orderBy,
    skip,
    take,
  })
}

const count = async (where?: Prisma.ContactWhereInput) => {
  return prisma.contact.count({
    where,
  })
}

const update = async (id: string, data: Prisma.ContactUpdateInput) => {
  return prisma.contact.update({
    where: { id },
    data,
  })
}

const remove = async (id: string) => {
  return prisma.contact.delete({
    where: { id },
  })
}

export const contactRepository = {
  create,
  findById,
  findMany,
  count,
  update,
  remove,
}
