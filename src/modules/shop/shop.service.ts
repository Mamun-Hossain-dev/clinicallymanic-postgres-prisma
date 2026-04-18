import { Prisma, Role, ShopOrderStatus } from '@prisma/client'
import Stripe from 'stripe'
import config from '../../config'
import AppError from '../../errors/AppError'
import prisma from '../../lib/prisma'
import { fileUploader } from '../../utils/fileUpload'
import pagination from '../../utils/pagination'
import { shopOrderSearchableFields, shopProductSearchableFields } from './shop.constants'
import {
  CheckoutShopProductInput,
  ShopOrderFilterOptions,
  ShopOrderPaginationOptions,
  ShopProductFilterOptions,
  ShopProductPaginationOptions,
} from './shop.interface'
import { shopRepository } from './shop.repository'

const getStripeClient = () => {
  if (!config.stripe.secretKey) {
    throw new AppError(500, 'Stripe secret key is not configured')
  }

  return new Stripe(config.stripe.secretKey)
}

const uploadProductImages = async (files?: Express.Multer.File[]) => {
  if (!files?.length) {
    return {
      imageUrls: [] as string[],
      imagePublicIds: [] as string[],
    }
  }

  const uploadedFiles = await Promise.all(files.map(file => fileUploader.uploadToCloudinary(file)))

  return {
    imageUrls: uploadedFiles.map(file => file.url),
    imagePublicIds: uploadedFiles.map(file => file.publicId),
  }
}

const createShopProduct = async (
  userId: string,
  payload: Omit<Prisma.ShopProductCreateInput, 'createdBy'>,
  files?: Express.Multer.File[]
) => {
  const uploadedImages = await uploadProductImages(files)
  const payloadImageUrls = Array.isArray(payload.imageUrls) ? payload.imageUrls : []
  const payloadImagePublicIds = Array.isArray(payload.imagePublicIds) ? payload.imagePublicIds : []
  const imageUrls = uploadedImages.imageUrls.length ? uploadedImages.imageUrls : payloadImageUrls
  const imagePublicIds = uploadedImages.imagePublicIds.length
    ? uploadedImages.imagePublicIds
    : payloadImagePublicIds

  if (!imageUrls?.length) {
    throw new AppError(400, 'At least one product image is required')
  }

  return shopRepository.createProduct({
    ...payload,
    imageUrls,
    imagePublicIds: imagePublicIds || [],
    createdBy: {
      connect: { id: userId },
    },
  })
}

const getShopProductById = async (id: string) => {
  const product = await shopRepository.findProductById(id)
  if (!product) {
    throw new AppError(404, 'Shop product not found')
  }

  return product
}

const getAllShopProducts = async (
  filterOptions: ShopProductFilterOptions,
  paginationOptions: ShopProductPaginationOptions
) => {
  const { searchTerm, category, ...filterData } = filterOptions
  const { page, limit, skip, sortBy, sortOrder } = pagination(paginationOptions)

  const andConditions: Prisma.ShopProductWhereInput[] = []

  if (searchTerm) {
    andConditions.push({
      OR: shopProductSearchableFields.map(field => ({
        [field]: { contains: searchTerm, mode: 'insensitive' as Prisma.QueryMode },
      })),
    })
  }

  if (category) {
    andConditions.push({
      categories: {
        has: category,
      },
    })
  }

  Object.entries(filterData).forEach(([field, value]) => {
    if (value !== undefined && value !== null) {
      andConditions.push({ [field]: value })
    }
  })

  const whereCondition: Prisma.ShopProductWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {}

  const orderBy: Prisma.ShopProductOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  }

  const [products, total] = await Promise.all([
    shopRepository.findProducts({
      where: whereCondition,
      orderBy,
      skip,
      take: limit,
    }),
    shopRepository.countProducts(whereCondition),
  ])

  return {
    data: products,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
}

const updateShopProductById = async (
  id: string,
  payload: Prisma.ShopProductUpdateInput,
  files?: Express.Multer.File[]
) => {
  const existingProduct = await shopRepository.findProductById(id)
  if (!existingProduct) {
    throw new AppError(404, 'Shop product not found')
  }

  const finalPayload: Prisma.ShopProductUpdateInput = { ...payload }

  if (files?.length) {
    await Promise.all(
      existingProduct.imagePublicIds.map(publicId => fileUploader.deleteFromCloudinary(publicId))
    )

    const uploadedImages = await uploadProductImages(files)
    finalPayload.imageUrls = uploadedImages.imageUrls
    finalPayload.imagePublicIds = uploadedImages.imagePublicIds
  }

  return shopRepository.updateProduct(id, finalPayload)
}

const deleteShopProductById = async (id: string) => {
  const existingProduct = await shopRepository.findProductById(id)
  if (!existingProduct) {
    throw new AppError(404, 'Shop product not found')
  }

  await Promise.all(
    existingProduct.imagePublicIds.map(publicId => fileUploader.deleteFromCloudinary(publicId))
  )

  return shopRepository.removeProduct(id)
}

const checkoutShopProduct = async (
  userId: string,
  productId: string,
  payload: CheckoutShopProductInput
) => {
  const [user, product] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    shopRepository.findProductById(productId),
  ])

  if (!user) {
    throw new AppError(404, 'User not found')
  }

  if (!product || product.status !== 'ACTIVE') {
    throw new AppError(404, 'Active shop product not found')
  }

  if (product.type === 'EXCLUSIVE' && !user.isSubscribed) {
    throw new AppError(403, 'Please subscribe to access this exclusive product')
  }

  if (product.sizes.length && (!payload.size || !product.sizes.includes(payload.size))) {
    throw new AppError(400, 'Invalid product size')
  }

  const stripe = getStripeClient()
  const amount = Number(product.price)
  const unitAmount = Math.round(amount * 100)
  const successUrl = `${config.clientUrl}/payment-success`
  const cancelUrl = `${config.clientUrl}/payment-cancel`

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: user.email,
    success_url: successUrl,
    cancel_url: cancelUrl,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: unitAmount,
          product_data: {
            name: product.name,
            description: product.description,
            images: product.imageUrls.slice(0, 8),
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      paymentType: 'SHOP',
      userId,
      productId: product.id,
      amount: product.price.toString(),
    },
  })

  const checkoutRecords = await shopRepository.createCheckoutRecords({
    order: {
      productName: product.name,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      customerEmail: payload.customerEmail || user.email,
      deliveryLocation: payload.deliveryLocation,
      price: product.price,
      currency: 'usd',
      size: payload.size,
      notes: payload.notes,
      user: {
        connect: { id: user.id },
      },
      product: {
        connect: { id: product.id },
      },
    },
    payment: {
      amount: product.price,
      currency: 'usd',
      status: 'PENDING',
      type: 'SHOP',
      provider: 'STRIPE',
      stripeCheckoutSessionId: session.id,
      metadata: {
        stripeSessionUrl: session.url,
        productType: product.type,
      },
      user: {
        connect: { id: user.id },
      },
      product: {
        connect: { id: product.id },
      },
    },
  })

  return {
    url: session.url,
    sessionId: session.id,
    order: checkoutRecords.order,
    payment: checkoutRecords.payment,
  }
}

const getAllShopOrders = async (
  requester: { id: string; role: string },
  filterOptions: ShopOrderFilterOptions,
  paginationOptions: ShopOrderPaginationOptions
) => {
  const { searchTerm, ...filterData } = filterOptions
  const { page, limit, skip, sortBy, sortOrder } = pagination(paginationOptions)

  const andConditions: Prisma.ShopOrderWhereInput[] = []

  if (searchTerm) {
    andConditions.push({
      OR: shopOrderSearchableFields.map(field => ({
        [field]: { contains: searchTerm, mode: 'insensitive' as Prisma.QueryMode },
      })),
    })
  }

  Object.entries(filterData).forEach(([field, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      andConditions.push({ [field]: value })
    }
  })

  if (requester.role !== Role.ADMIN) {
    andConditions.push({ userId: requester.id })
  }

  const whereCondition: Prisma.ShopOrderWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {}

  const orderBy: Prisma.ShopOrderOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  }

  const [orders, total] = await Promise.all([
    shopRepository.findOrders({
      where: whereCondition,
      orderBy,
      skip,
      take: limit,
    }),
    shopRepository.countOrders(whereCondition),
  ])

  return {
    data: orders,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
}

const updateShopOrderStatus = async (id: string, status: ShopOrderStatus) => {
  const existingOrder = await shopRepository.findOrderById(id)
  if (!existingOrder) {
    throw new AppError(404, 'Shop order not found')
  }

  return shopRepository.updateOrder(id, { status })
}

export const shopService = {
  createShopProduct,
  getShopProductById,
  getAllShopProducts,
  updateShopProductById,
  deleteShopProductById,
  checkoutShopProduct,
  getAllShopOrders,
  updateShopOrderStatus,
}
