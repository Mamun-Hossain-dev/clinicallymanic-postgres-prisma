import { BillingInterval, Prisma, Role, SubscriptionStatus } from '@prisma/client'
import Stripe from 'stripe'
import config from '../../config'
import AppError from '../../errors/AppError'
import prisma from '../../lib/prisma'
import pagination from '../../utils/pagination'
import { SUBSCRIPTION_CONFIG } from './subscription.constants'
import {
  CreateCheckoutInput,
  CreatePlanInput,
  PlanFilterOptions,
  PlanPaginationOptions,
  RefundRequestInput,
  Requester,
  SubscriptionFilterOptions,
  SubscriptionPaginationOptions,
  UpdatePlanInput,
} from './subscription.interface'
import { subscriptionRepository } from './subscription.repository'

// ---- Stripe helpers ----

const getStripeClient = () => {
  if (!config.stripe.secretKey) {
    throw new AppError(500, 'Stripe secret key is not configured')
  }

  return new Stripe(config.stripe.secretKey)
}

const intervalToStripe = (
  interval: BillingInterval
): { unit: 'day' | 'week' | 'month' | 'year'; count: number } => {
  switch (interval) {
    case 'WEEKLY':
      return { unit: 'week', count: 1 }
    case 'MONTHLY':
      return { unit: 'month', count: 1 }
    case 'YEARLY':
      return { unit: 'year', count: 1 }
    default:
      return { unit: 'month', count: 1 }
  }
}

const ensureStripeCustomer = async (userId: string): Promise<string> => {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError(404, 'User not found')

  if (user.stripeCustomerId) return user.stripeCustomerId

  const stripe = getStripeClient()
  const customer = await stripe.customers.create({
    email: user.email,
    name: `${user.firstName} ${user.lastName ?? ''}`.trim(),
    metadata: { userId: user.id },
  })

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  })

  return customer.id
}

// ---------- PLAN CRUD ----------

const createPlan = async (payload: CreatePlanInput) => {
  const existing = await subscriptionRepository.findPlanByName(payload.name)
  if (existing) throw new AppError(400, 'A plan with this name already exists')

  const stripe = getStripeClient()
  const { unit, count } = intervalToStripe(payload.interval)

  const stripeProduct = await stripe.products.create({
    name: payload.name,
    description: payload.description ?? undefined,
    metadata: {
      features: payload.features.join(','),
    },
  })

  const stripePrice = await stripe.prices.create({
    product: stripeProduct.id,
    unit_amount: Math.round(payload.price * 100),
    currency: payload.currency,
    recurring: {
      interval: unit,
      interval_count: (payload.intervalCount ?? 1) * count,
    },
  })

  const plan = await subscriptionRepository.createPlan({
    name: payload.name,
    description: payload.description,
    price: new Prisma.Decimal(payload.price),
    currency: payload.currency,
    interval: payload.interval,
    intervalCount: payload.intervalCount,
    trialDays: payload.trialDays ?? SUBSCRIPTION_CONFIG.DEFAULT_TRIAL_DAYS,
    features: payload.features,
    isActive: payload.isActive,
    sortOrder: payload.sortOrder,
    stripeProductId: stripeProduct.id,
    stripePriceId: stripePrice.id,
  })

  return plan
}

const updatePlan = async (id: string, payload: UpdatePlanInput) => {
  const plan = await subscriptionRepository.findPlanById(id)
  if (!plan) throw new AppError(404, 'Plan not found')

  const stripe = getStripeClient()
  const data: Prisma.SubscriptionPlanUpdateInput = { ...payload }

  // Sync product-level metadata (name, description, active)
  if (
    plan.stripeProductId &&
    (payload.name || payload.description || payload.isActive !== undefined)
  ) {
    await stripe.products.update(plan.stripeProductId, {
      ...(payload.name ? { name: payload.name } : {}),
      ...(payload.description !== undefined ? { description: payload.description } : {}),
      ...(payload.isActive !== undefined ? { active: payload.isActive } : {}),
    })
  }

  // Stripe prices are immutable — create a new price if price/currency/interval changed
  const priceChanged =
    payload.price !== undefined ||
    payload.currency !== undefined ||
    payload.interval !== undefined ||
    payload.intervalCount !== undefined

  if (priceChanged && plan.stripeProductId) {
    const newPriceValue = payload.price ?? Number(plan.price)
    const newCurrency = payload.currency ?? plan.currency
    const newInterval = payload.interval ?? plan.interval
    const newIntervalCount = payload.intervalCount ?? plan.intervalCount
    const { unit, count } = intervalToStripe(newInterval)

    const newStripePrice = await stripe.prices.create({
      product: plan.stripeProductId,
      unit_amount: Math.round(newPriceValue * 100),
      currency: newCurrency,
      recurring: {
        interval: unit,
        interval_count: newIntervalCount * count,
      },
    })

    if (plan.stripePriceId) {
      // Archive old price so new signups use the new one
      await stripe.prices.update(plan.stripePriceId, { active: false })
    }

    data.stripePriceId = newStripePrice.id
  }

  if (payload.price !== undefined) data.price = new Prisma.Decimal(payload.price)

  return subscriptionRepository.updatePlan(id, data)
}

const deletePlan = async (id: string) => {
  const plan = await subscriptionRepository.findPlanById(id)
  if (!plan) throw new AppError(404, 'Plan not found')

  const stripe = getStripeClient()

  if (plan.stripeProductId) {
    await stripe.products.update(plan.stripeProductId, { active: false })
  }
  if (plan.stripePriceId) {
    await stripe.prices.update(plan.stripePriceId, { active: false })
  }

  return subscriptionRepository.updatePlan(id, {
    isActive: false,
    deletedAt: new Date(),
  })
}

const getPlanById = async (id: string) => {
  const plan = await subscriptionRepository.findPlanById(id)
  if (!plan) throw new AppError(404, 'Plan not found')
  return plan
}

const getAllPlans = async (
  filters: PlanFilterOptions,
  paginationOptions: PlanPaginationOptions
) => {
  const { searchTerm, interval, isActive } = filters
  const { page, limit, skip, sortBy, sortOrder } = pagination(paginationOptions)

  const andConditions: Prisma.SubscriptionPlanWhereInput[] = []

  if (searchTerm) {
    andConditions.push({
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ],
    })
  }

  if (interval) andConditions.push({ interval })
  if (isActive !== undefined) andConditions.push({ isActive })

  const where: Prisma.SubscriptionPlanWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {}

  const orderBy: Prisma.SubscriptionPlanOrderByWithRelationInput = {
    [sortBy === 'createdAt' ? 'createdAt' : sortBy]: sortOrder,
  }

  const [data, total] = await Promise.all([
    subscriptionRepository.findManyPlans({ where, orderBy, skip, take: limit }),
    subscriptionRepository.countPlans(where),
  ])

  return {
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  }
}

// ---------- USER: SUBSCRIBE (Checkout) ----------

const createCheckoutSession = async (requester: Requester, payload: CreateCheckoutInput) => {
  const plan = await subscriptionRepository.findPlanById(payload.planId)
  if (!plan || !plan.isActive) throw new AppError(404, 'Plan not available')
  if (!plan.stripePriceId) throw new AppError(500, 'Plan is not synced to Stripe')

  const existing = await subscriptionRepository.findActiveSubscriptionByUserId(requester.id)
  if (existing) {
    throw new AppError(
      400,
      'You already have an active subscription. Cancel it before subscribing to a new plan.'
    )
  }

  const customerId = await ensureStripeCustomer(requester.id)

  // Only give trial to first-time subscribers
  const previousSubscriptions = await prisma.userSubscription.count({
    where: { userId: requester.id },
  })
  const eligibleForTrial = previousSubscriptions === 0 && plan.trialDays > 0

  const stripe = getStripeClient()
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    subscription_data: eligibleForTrial ? { trial_period_days: plan.trialDays } : undefined,
    success_url:
      payload.successUrl ??
      `${config.clientUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: payload.cancelUrl ?? `${config.clientUrl}/subscription/cancel`,
    metadata: {
      userId: requester.id,
      planId: plan.id,
      paymentType: 'SUBSCRIPTION',
    },
  })

  // Seed a PaymentTransaction row (webhook will mark SUCCEEDED)
  await prisma.paymentTransaction.create({
    data: {
      amount: plan.price,
      currency: plan.currency,
      status: 'PENDING',
      type: 'SUBSCRIPTION',
      provider: 'STRIPE',
      stripeCheckoutSessionId: session.id,
      userId: requester.id,
      metadata: {
        planId: plan.id,
        trial: eligibleForTrial,
      },
    },
  })

  return {
    url: session.url,
    sessionId: session.id,
  }
}

// ---------- GET MY / ALL SUBSCRIPTIONS ----------

const getMySubscription = async (userId: string) => {
  return subscriptionRepository.findActiveSubscriptionByUserId(userId)
}

const getSubscriptionById = async (requester: Requester, id: string) => {
  const sub = await subscriptionRepository.findSubscriptionById(id)
  if (!sub) throw new AppError(404, 'Subscription not found')
  if (requester.role !== Role.ADMIN && sub.userId !== requester.id) {
    throw new AppError(403, 'You are not authorized to view this subscription')
  }
  return sub
}

const getAllSubscriptions = async (
  requester: Requester,
  filters: SubscriptionFilterOptions,
  paginationOptions: SubscriptionPaginationOptions
) => {
  const { searchTerm, status, planId, userId } = filters
  const { page, limit, skip, sortBy, sortOrder } = pagination(paginationOptions)

  const andConditions: Prisma.UserSubscriptionWhereInput[] = []

  if (searchTerm) {
    andConditions.push({
      OR: [
        { stripeSubscriptionId: { contains: searchTerm, mode: 'insensitive' } },
        { user: { email: { contains: searchTerm, mode: 'insensitive' } } },
        { plan: { name: { contains: searchTerm, mode: 'insensitive' } } },
      ],
    })
  }

  if (status) andConditions.push({ status })
  if (planId) andConditions.push({ planId })
  if (userId) andConditions.push({ userId })

  if (requester.role !== Role.ADMIN) {
    andConditions.push({ userId: requester.id })
  }

  const where: Prisma.UserSubscriptionWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {}

  const orderBy: Prisma.UserSubscriptionOrderByWithRelationInput = { [sortBy]: sortOrder }

  const [data, total] = await Promise.all([
    subscriptionRepository.findManySubscriptions({ where, orderBy, skip, take: limit }),
    subscriptionRepository.countSubscriptions(where),
  ])

  return {
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  }
}

// ---------- CANCEL / RESUME ----------

const cancelSubscription = async (requester: Requester, id: string) => {
  const sub = await subscriptionRepository.findSubscriptionById(id)
  if (!sub) throw new AppError(404, 'Subscription not found')
  if (requester.role !== Role.ADMIN && sub.userId !== requester.id) {
    throw new AppError(403, 'You are not authorized to cancel this subscription')
  }
  if (!sub.stripeSubscriptionId) {
    throw new AppError(400, 'Subscription is not linked to Stripe')
  }
  if (sub.status === 'CANCELED' || sub.status === 'EXPIRED') {
    throw new AppError(400, 'Subscription is already canceled')
  }

  const stripe = getStripeClient()
  await stripe.subscriptions.update(sub.stripeSubscriptionId, {
    cancel_at_period_end: true,
  })

  return subscriptionRepository.updateSubscription(id, {
    cancelAtPeriodEnd: true,
    canceledAt: new Date(),
  })
}

const resumeSubscription = async (requester: Requester, id: string) => {
  const sub = await subscriptionRepository.findSubscriptionById(id)
  if (!sub) throw new AppError(404, 'Subscription not found')
  if (requester.role !== Role.ADMIN && sub.userId !== requester.id) {
    throw new AppError(403, 'You are not authorized to resume this subscription')
  }
  if (!sub.cancelAtPeriodEnd) {
    throw new AppError(400, 'Subscription is not scheduled for cancellation')
  }
  if (!sub.stripeSubscriptionId) {
    throw new AppError(400, 'Subscription is not linked to Stripe')
  }

  const stripe = getStripeClient()
  await stripe.subscriptions.update(sub.stripeSubscriptionId, {
    cancel_at_period_end: false,
  })

  return subscriptionRepository.updateSubscription(id, {
    cancelAtPeriodEnd: false,
    canceledAt: null,
  })
}

// ---------- REFUND (50%, 15-day window, access until period end) ----------

const requestRefund = async (requester: Requester, id: string, payload: RefundRequestInput) => {
  const sub = await subscriptionRepository.findSubscriptionById(id)
  if (!sub) throw new AppError(404, 'Subscription not found')
  if (requester.role !== Role.ADMIN && sub.userId !== requester.id) {
    throw new AppError(403, 'You are not authorized to refund this subscription')
  }

  const allowedStatuses: SubscriptionStatus[] = ['TRIALING', 'ACTIVE', 'PAST_DUE']
  if (!allowedStatuses.includes(sub.status)) {
    throw new AppError(400, `Subscription is ${sub.status} — refund not allowed`)
  }

  // 15-day refund window from subscription start
  const now = new Date()
  const windowMs = SUBSCRIPTION_CONFIG.REFUND_WINDOW_DAYS * 24 * 60 * 60 * 1000
  const elapsed = now.getTime() - sub.startedAt.getTime()
  if (elapsed > windowMs) {
    throw new AppError(
      400,
      `Refund window of ${SUBSCRIPTION_CONFIG.REFUND_WINDOW_DAYS} days has expired`
    )
  }

  // Find most recent successful payment for this subscription
  const payment = await prisma.paymentTransaction.findFirst({
    where: {
      userId: sub.userId,
      type: 'SUBSCRIPTION',
      status: 'SUCCEEDED',
      subscriptionId: sub.id,
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!payment || !payment.stripePaymentIntentId) {
    throw new AppError(400, 'No successful payment found to refund')
  }

  // Block duplicate refunds
  const existingRefund = await prisma.subscriptionRefund.findFirst({
    where: {
      subscriptionId: sub.id,
      status: { in: ['PENDING', 'SUCCEEDED'] },
    },
  })
  if (existingRefund) {
    throw new AppError(400, 'A refund is already pending or processed for this subscription')
  }

  const originalAmount = Number(payment.amount)
  const refundAmount = Math.round(originalAmount * SUBSCRIPTION_CONFIG.REFUND_PERCENTAGE * 100) // cents

  const stripe = getStripeClient()
  const stripeRefund = await stripe.refunds.create({
    payment_intent: payment.stripePaymentIntentId,
    amount: refundAmount,
    reason: 'requested_by_customer',
    metadata: {
      subscriptionId: sub.id,
      userId: sub.userId,
      reason: payload.reason ?? 'User requested 50% refund',
    },
  })

  // Access remains until currentPeriodEnd (per policy). Mark subscription REFUNDED.
  // cancel_at_period_end = true so renewal is blocked.
  if (sub.stripeSubscriptionId) {
    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: true,
    })
  }

  const [refundRecord] = await prisma.$transaction([
    prisma.subscriptionRefund.create({
      data: {
        subscriptionId: sub.id,
        paymentTransactionId: payment.id,
        originalAmount: payment.amount,
        refundedAmount: new Prisma.Decimal(refundAmount / 100),
        currency: payment.currency,
        stripeRefundId: stripeRefund.id,
        reason: payload.reason,
        status: stripeRefund.status === 'succeeded' ? 'SUCCEEDED' : 'PENDING',
        processedAt: stripeRefund.status === 'succeeded' ? new Date() : null,
      },
    }),
    prisma.userSubscription.update({
      where: { id: sub.id },
      data: {
        status: 'REFUNDED',
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
      },
    }),
    prisma.paymentTransaction.update({
      where: { id: payment.id },
      data: { status: 'REFUNDED' },
    }),
  ])

  return refundRecord
}

// ---------- FEATURE ACCESS CHECK (used by middleware) ----------

const userHasFeature = async (userId: string, feature: string): Promise<boolean> => {
  const sub = await prisma.userSubscription.findFirst({
    where: {
      userId,
      deletedAt: null,
      status: { in: ['TRIALING', 'ACTIVE'] },
      OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { gt: new Date() } }],
    },
    include: { plan: true },
  })

  if (!sub) return false
  return sub.plan.features.includes(feature as never)
}

export const subscriptionService = {
  createPlan,
  updatePlan,
  deletePlan,
  getPlanById,
  getAllPlans,
  createCheckoutSession,
  getMySubscription,
  getSubscriptionById,
  getAllSubscriptions,
  cancelSubscription,
  resumeSubscription,
  requestRefund,
  userHasFeature,
}
