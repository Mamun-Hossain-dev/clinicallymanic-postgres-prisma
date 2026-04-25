import { BillingInterval, Prisma } from '@prisma/client'
import prisma from '../../lib/prisma'

const planInclude = {
  _count: {
    select: { subscriptions: true },
  },
} satisfies Prisma.SubscriptionPlanInclude

const subscriptionInclude = {
  plan: true,
  user: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  },
  refunds: true,
} satisfies Prisma.UserSubscriptionInclude

// ---- Plan ----
const createPlan = async (data: Prisma.SubscriptionPlanCreateInput) => {
  return prisma.subscriptionPlan.create({ data })
}

const findPlanById = async (id: string) => {
  return prisma.subscriptionPlan.findFirst({
    where: { id, deletedAt: null },
    include: planInclude,
  })
}

const findPlanByNameAndInterval = async (name: string, interval: BillingInterval) => {
  return prisma.subscriptionPlan.findFirst({ where: { name, interval, deletedAt: null } })
}

const updatePlan = async (id: string, data: Prisma.SubscriptionPlanUpdateInput) => {
  return prisma.subscriptionPlan.update({ where: { id }, data })
}

const findManyPlans = async (params: {
  where?: Prisma.SubscriptionPlanWhereInput
  orderBy?: Prisma.SubscriptionPlanOrderByWithRelationInput
  skip?: number
  take?: number
}) => {
  const { where, orderBy, skip, take } = params
  return prisma.subscriptionPlan.findMany({
    where: { ...where, deletedAt: null },
    orderBy,
    skip,
    take,
    include: planInclude,
  })
}

const countPlans = async (where?: Prisma.SubscriptionPlanWhereInput) => {
  return prisma.subscriptionPlan.count({ where: { ...where, deletedAt: null } })
}

// ---- Subscription ----
const createSubscription = async (data: Prisma.UserSubscriptionCreateInput) => {
  return prisma.userSubscription.create({ data, include: subscriptionInclude })
}

const findSubscriptionById = async (id: string) => {
  return prisma.userSubscription.findFirst({
    where: { id, deletedAt: null },
    include: subscriptionInclude,
  })
}

const findActiveSubscriptionByUserId = async (userId: string) => {
  return prisma.userSubscription.findFirst({
    where: {
      userId,
      deletedAt: null,
      status: { in: ['TRIALING', 'ACTIVE', 'PAST_DUE'] },
    },
    include: subscriptionInclude,
    orderBy: { createdAt: 'desc' },
  })
}

const findByStripeSubscriptionId = async (stripeSubscriptionId: string) => {
  return prisma.userSubscription.findUnique({
    where: { stripeSubscriptionId },
    include: subscriptionInclude,
  })
}

const updateSubscription = async (id: string, data: Prisma.UserSubscriptionUpdateInput) => {
  return prisma.userSubscription.update({ where: { id }, data })
}

const findManySubscriptions = async (params: {
  where?: Prisma.UserSubscriptionWhereInput
  orderBy?: Prisma.UserSubscriptionOrderByWithRelationInput
  skip?: number
  take?: number
}) => {
  const { where, orderBy, skip, take } = params
  return prisma.userSubscription.findMany({
    where: { ...where, deletedAt: null },
    orderBy,
    skip,
    take,
    include: subscriptionInclude,
  })
}

const countSubscriptions = async (where?: Prisma.UserSubscriptionWhereInput) => {
  return prisma.userSubscription.count({ where: { ...where, deletedAt: null } })
}

// ---- Refund ----
const findRefundsBySubscriptionId = async (subscriptionId: string) => {
  return prisma.subscriptionRefund.findMany({
    where: { subscriptionId },
    orderBy: { createdAt: 'desc' },
  })
}

export const subscriptionRepository = {
  createPlan,
  findPlanById,
  findPlanByNameAndInterval,
  updatePlan,
  findManyPlans,
  countPlans,
  createSubscription,
  findSubscriptionById,
  findActiveSubscriptionByUserId,
  findByStripeSubscriptionId,
  updateSubscription,
  findManySubscriptions,
  countSubscriptions,
  findRefundsBySubscriptionId,
}
