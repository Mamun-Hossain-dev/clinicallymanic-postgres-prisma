import { Prisma } from '@prisma/client'
import prisma from '../../lib/prisma'

const shopProductInclude = {
  createdBy: true,
} satisfies Prisma.ShopProductInclude

const shopOrderInclude = {
  user: true,
  product: true,
  payment: true,
} satisfies Prisma.ShopOrderInclude

const createProduct = async (data: Prisma.ShopProductCreateInput) => {
  return prisma.shopProduct.create({
    data,
    include: shopProductInclude,
  })
}

const findProductById = async (id: string) => {
  return prisma.shopProduct.findUnique({
    where: { id },
    include: shopProductInclude,
  })
}

const findProducts = async (params: {
  where?: Prisma.ShopProductWhereInput
  orderBy?: Prisma.ShopProductOrderByWithRelationInput
  skip?: number
  take?: number
}) => {
  const { where, orderBy, skip, take } = params
  return prisma.shopProduct.findMany({
    where,
    orderBy,
    skip,
    take,
    include: shopProductInclude,
  })
}

const countProducts = async (where?: Prisma.ShopProductWhereInput) => {
  return prisma.shopProduct.count({ where })
}

const updateProduct = async (id: string, data: Prisma.ShopProductUpdateInput) => {
  return prisma.shopProduct.update({
    where: { id },
    data,
    include: shopProductInclude,
  })
}

const removeProduct = async (id: string) => {
  return prisma.shopProduct.delete({
    where: { id },
  })
}

const createCheckoutRecords = async (params: {
  order: Prisma.ShopOrderCreateInput
  payment: Omit<Prisma.PaymentTransactionCreateInput, 'order'>
}) => {
  const { order, payment } = params

  return prisma.$transaction(async tx => {
    const createdOrder = await tx.shopOrder.create({
      data: order,
      include: shopOrderInclude,
    })

    const createdPayment = await tx.paymentTransaction.create({
      data: {
        ...payment,
        order: {
          connect: { id: createdOrder.id },
        },
      },
    })

    return {
      order: createdOrder,
      payment: createdPayment,
    }
  })
}

const findOrders = async (params: {
  where?: Prisma.ShopOrderWhereInput
  orderBy?: Prisma.ShopOrderOrderByWithRelationInput
  skip?: number
  take?: number
}) => {
  const { where, orderBy, skip, take } = params
  return prisma.shopOrder.findMany({
    where,
    orderBy,
    skip,
    take,
    include: shopOrderInclude,
  })
}

const countOrders = async (where?: Prisma.ShopOrderWhereInput) => {
  return prisma.shopOrder.count({ where })
}

const findOrderById = async (id: string) => {
  return prisma.shopOrder.findUnique({
    where: { id },
    include: shopOrderInclude,
  })
}

const updateOrder = async (id: string, data: Prisma.ShopOrderUpdateInput) => {
  return prisma.shopOrder.update({
    where: { id },
    data,
    include: shopOrderInclude,
  })
}

export const shopRepository = {
  createProduct,
  findProductById,
  findProducts,
  countProducts,
  updateProduct,
  removeProduct,
  createCheckoutRecords,
  findOrders,
  countOrders,
  findOrderById,
  updateOrder,
}
