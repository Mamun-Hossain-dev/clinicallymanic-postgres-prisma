import { Prisma, Role, ShopOrderStatus } from '@prisma/client'
import Stripe from 'stripe'
import config from '../../config'
import AppError from '../../errors/AppError'
import prisma from '../../lib/prisma'
import { cacheDel, cacheGet, cacheSet } from '../../utils/chache'
import { fileUploader } from '../../utils/fileUpload'
import logger from '../../utils/logger'
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

const SHOP_PRODUCT_CACHE_TTL = 60 * 5 // 5 minutes
const SHOP_PRODUCT_VERSION_TTL = 60 * 60 * 24 * 30 // 30 days
const SHOP_PRODUCT_LIST_VERSION_KEY = 'shop:product:list:version'

const cacheKey = {
  productById: (id: string) => `shop:product:id:${id}`,
  productList: (version: string, payload: object) =>
    `shop:product:list:v${version}:${JSON.stringify(payload)}`,
}

const getShopProductListVersion = async () => {
  const version = await cacheGet<string>(SHOP_PRODUCT_LIST_VERSION_KEY)
  if (version !== null) return version

  const initialVersion = '1'
  await cacheSet(SHOP_PRODUCT_LIST_VERSION_KEY, initialVersion, SHOP_PRODUCT_VERSION_TTL)
  return initialVersion
}

const invalidateShopProductLists = async () =>
  cacheSet(SHOP_PRODUCT_LIST_VERSION_KEY, Date.now().toString(), SHOP_PRODUCT_VERSION_TTL)

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

  const product = await shopRepository.createProduct({
    ...payload,
    imageUrls,
    imagePublicIds: imagePublicIds || [],
    createdBy: {
      connect: { id: userId },
    },
  })

  await invalidateShopProductLists()

  return product
}

const getShopProductById = async (id: string) => {
  const startedAt = Date.now()
  const cachedProduct = await cacheGet<Awaited<ReturnType<typeof shopRepository.findProductById>>>(
    cacheKey.productById(id)
  )

  if (cachedProduct) {
    logger.info(
      `[shop-product-cache] hit key=${cacheKey.productById(id)} totalMs=${Date.now() - startedAt}`
    )
    return cachedProduct
  }

  logger.info(`[shop-product-cache] miss key=${cacheKey.productById(id)}`)
  const dbStartedAt = Date.now()
  const product = await shopRepository.findProductById(id)
  if (!product) {
    throw new AppError(404, 'Shop product not found')
  }

  await cacheSet(cacheKey.productById(id), product, SHOP_PRODUCT_CACHE_TTL)
  logger.info(
    `[shop-product-cache] set key=${cacheKey.productById(id)} dbMs=${Date.now() - dbStartedAt} totalMs=${Date.now() - startedAt}`
  )

  return product
}

const getAllShopProducts = async (
  filterOptions: ShopProductFilterOptions,
  paginationOptions: ShopProductPaginationOptions
) => {
  const startedAt = Date.now()
  const listVersion = await getShopProductListVersion()
  const listCachePayload = {
    searchTerm: filterOptions.searchTerm ?? null,
    category: filterOptions.category ?? null,
    type: filterOptions.type ?? null,
    status: filterOptions.status ?? null,
    page: paginationOptions.page ?? 1,
    limit: paginationOptions.limit ?? 10,
    sortBy: paginationOptions.sortBy ?? 'createdAt',
    sortOrder: paginationOptions.sortOrder ?? 'desc',
  }
  const listCacheKey = cacheKey.productList(listVersion, listCachePayload)

  const cachedResult = await cacheGet<{
    data: Awaited<ReturnType<typeof shopRepository.findProducts>>
    meta: { total: number; page: number; limit: number; totalPages: number }
  }>(listCacheKey)

  if (cachedResult) {
    logger.info(`[shop-product-cache] hit key=${listCacheKey} totalMs=${Date.now() - startedAt}`)
    return cachedResult
  }

  logger.info(`[shop-product-cache] miss key=${listCacheKey}`)
  const dbStartedAt = Date.now()
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

  const response = {
    data: products,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }

  await cacheSet(listCacheKey, response, SHOP_PRODUCT_CACHE_TTL)
  logger.info(
    `[shop-product-cache] set key=${listCacheKey} dbMs=${Date.now() - dbStartedAt} totalMs=${Date.now() - startedAt}`
  )

  return response
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

  const updatedProduct = await shopRepository.updateProduct(id, finalPayload)
  await Promise.all([cacheDel(cacheKey.productById(id)), invalidateShopProductLists()])

  return updatedProduct
}

const deleteShopProductById = async (id: string) => {
  const existingProduct = await shopRepository.findProductById(id)
  if (!existingProduct) {
    throw new AppError(404, 'Shop product not found')
  }

  await Promise.all(
    existingProduct.imagePublicIds.map(publicId => fileUploader.deleteFromCloudinary(publicId))
  )

  const deletedProduct = await shopRepository.removeProduct(id)
  await Promise.all([cacheDel(cacheKey.productById(id)), invalidateShopProductLists()])

  return deletedProduct
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
