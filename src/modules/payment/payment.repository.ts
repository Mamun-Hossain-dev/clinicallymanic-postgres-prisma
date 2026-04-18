import { Prisma } from '@prisma/client'
import prisma from '../../lib/prisma'

const paymentInclude = {
  user: true,
  product: true,
  order: true,
} satisfies Prisma.PaymentTransactionInclude

const findMany = async (params: {
  where?: Prisma.PaymentTransactionWhereInput
  orderBy?: Prisma.PaymentTransactionOrderByWithRelationInput
  skip?: number
  take?: number
}) => {
  const { where, orderBy, skip, take } = params
  return prisma.paymentTransaction.findMany({
    where,
    orderBy,
    skip,
    take,
    include: paymentInclude,
  })
}

const count = async (where?: Prisma.PaymentTransactionWhereInput) => {
  return prisma.paymentTransaction.count({ where })
}

export const paymentRepository = {
  findMany,
  count,
}
