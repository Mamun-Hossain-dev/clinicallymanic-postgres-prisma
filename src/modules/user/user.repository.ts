import { Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
import config from '../../config'
import prisma from '../../lib/prisma'

const create = async (data: Prisma.UserCreateInput) => {
  const hashedPassword = await bcrypt.hash(data.password, config.bcryptSaltRounds)

  return prisma.user.create({
    data: {
      ...data,
      password: hashedPassword,
    },
    omit: { password: true },
  })
}

const findById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    omit: { password: true },
  })
}

const findByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: { email },
  })
}

const findMany = async (params: {
  where?: Prisma.UserWhereInput
  orderBy?: Prisma.UserOrderByWithRelationInput
  skip?: number
  take?: number
}) => {
  return prisma.user.findMany({
    where: params.where,
    orderBy: params.orderBy,
    skip: params.skip,
    take: params.take,
    omit: { password: true },
  })
}

const count = async (where?: Prisma.UserWhereInput) => {
  return prisma.user.count({ where })
}

const update = async (id: string, data: Prisma.UserUpdateInput) => {
  return prisma.user.update({
    where: { id },
    data,
    omit: { password: true },
  })
}

const remove = async (id: string) => {
  return prisma.user.delete({
    where: { id },
  })
}

export const userRepository = {
  create,
  findById,
  findByEmail,
  findMany,
  count,
  update,
  remove,
}
