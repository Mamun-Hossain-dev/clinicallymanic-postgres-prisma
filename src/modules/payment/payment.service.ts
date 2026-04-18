import { Prisma, Role } from '@prisma/client'
import Stripe from 'stripe'
import config from '../../config'
import AppError from '../../errors/AppError'
import prisma from '../../lib/prisma'
import pagination from '../../utils/pagination'
import { paymentStatusValues, paymentTypeValues } from './payment.constants'
import { PaymentFilterOptions, PaymentPaginationOptions } from './payment.interface'
import { paymentRepository } from './payment.repository'

const getStripeClient = () => {
  if (!config.stripe.secretKey) {
    throw new AppError(500, 'Stripe secret key is not configured')
  }

  return new Stripe(config.stripe.secretKey)
}

const getAllPayments = async (
  requester: { id: string; role: string },
  filterOptions: PaymentFilterOptions,
  paginationOptions: PaymentPaginationOptions
) => {
  const { searchTerm, ...filterData } = filterOptions
  const { page, limit, skip, sortBy, sortOrder } = pagination(paginationOptions)

  const andConditions: Prisma.PaymentTransactionWhereInput[] = []

  if (searchTerm) {
    const normalizedSearchTerm = searchTerm.toUpperCase()
    const searchConditions: Prisma.PaymentTransactionWhereInput[] = [
      {
        currency: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
    ]

    if (
      paymentStatusValues.includes(normalizedSearchTerm as (typeof paymentStatusValues)[number])
    ) {
      searchConditions.push({
        status: normalizedSearchTerm as (typeof paymentStatusValues)[number],
      })
    }

    if (paymentTypeValues.includes(normalizedSearchTerm as (typeof paymentTypeValues)[number])) {
      searchConditions.push({
        type: normalizedSearchTerm as (typeof paymentTypeValues)[number],
      })
    }

    andConditions.push({
      OR: searchConditions,
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

  const whereCondition: Prisma.PaymentTransactionWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {}

  const orderBy: Prisma.PaymentTransactionOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  }

  const [payments, total] = await Promise.all([
    paymentRepository.findMany({
      where: whereCondition,
      orderBy,
      skip,
      take: limit,
    }),
    paymentRepository.count(whereCondition),
  ])

  return {
    data: payments,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
}

// ---------- Shop checkout.session.completed handler ----------
const handleShopCheckoutCompleted = async (session: Stripe.Checkout.Session) => {
  const payment = await prisma.paymentTransaction.findUnique({
    where: { stripeCheckoutSessionId: session.id },
  })

  if (!payment) return { skipped: true }
  if (payment.status === 'SUCCEEDED') return { alreadyProcessed: true }

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id

  await prisma.$transaction(async tx => {
    await tx.paymentTransaction.update({
      where: { id: payment.id },
      data: {
        status: 'SUCCEEDED',
        stripePaymentIntentId: paymentIntentId,
      },
    })

    if (payment.orderId) {
      await tx.shopOrder.update({
        where: { id: payment.orderId },
        data: { status: 'PAID' },
      })
    }

    if (payment.productId) {
      await tx.shopProduct.update({
        where: { id: payment.productId },
        data: {
          purchasers: { connect: { id: payment.userId } },
        },
      })
    }
  })

  return { processed: true }
}

// ---------- Subscription checkout.session.completed handler ----------
const handleSubscriptionCheckoutCompleted = async (session: Stripe.Checkout.Session) => {
  const payment = await prisma.paymentTransaction.findUnique({
    where: { stripeCheckoutSessionId: session.id },
  })
  if (!payment) return { skipped: true }

  const metadata = session.metadata ?? {}
  const userId = metadata.userId ?? payment.userId
  const planId = metadata.planId

  if (!planId) return { skipped: true }

  const stripeSubscriptionId =
    typeof session.subscription === 'string' ? session.subscription : session.subscription?.id

  if (!stripeSubscriptionId) return { skipped: true }

  const stripe = getStripeClient()
  const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId)

  const customerId =
    typeof session.customer === 'string' ? session.customer : session.customer?.id

  const statusMap: Record<string, 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'INCOMPLETE'> =
    {
      trialing: 'TRIALING',
      active: 'ACTIVE',
      past_due: 'PAST_DUE',
      canceled: 'CANCELED',
      incomplete: 'INCOMPLETE',
      incomplete_expired: 'INCOMPLETE',
      unpaid: 'PAST_DUE',
    }
  const mappedStatus = statusMap[stripeSub.status] ?? 'INCOMPLETE'

  const periodStart = stripeSub.items.data[0]?.current_period_start
  const periodEnd = stripeSub.items.data[0]?.current_period_end
  const trialStart = stripeSub.trial_start
  const trialEnd = stripeSub.trial_end

  await prisma.$transaction(async tx => {
    const existingSub = await tx.userSubscription.findUnique({
      where: { stripeSubscriptionId },
    })

    if (existingSub) {
      await tx.userSubscription.update({
        where: { id: existingSub.id },
        data: {
          status: mappedStatus,
          currentPeriodStart: periodStart ? new Date(periodStart * 1000) : null,
          currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
          trialStart: trialStart ? new Date(trialStart * 1000) : null,
          trialEnd: trialEnd ? new Date(trialEnd * 1000) : null,
          isTrialing: mappedStatus === 'TRIALING',
          stripeCustomerId: customerId,
        },
      })
    } else {
      await tx.userSubscription.create({
        data: {
          userId,
          planId,
          stripeSubscriptionId,
          stripeCustomerId: customerId,
          status: mappedStatus,
          currentPeriodStart: periodStart ? new Date(periodStart * 1000) : null,
          currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
          trialStart: trialStart ? new Date(trialStart * 1000) : null,
          trialEnd: trialEnd ? new Date(trialEnd * 1000) : null,
          isTrialing: mappedStatus === 'TRIALING',
        },
      })
    }

    const createdSub = await tx.userSubscription.findUnique({ where: { stripeSubscriptionId } })

    await tx.paymentTransaction.update({
      where: { id: payment.id },
      data: {
        status: mappedStatus === 'TRIALING' ? 'PENDING' : 'SUCCEEDED',
        subscriptionId: createdSub?.id,
      },
    })

    if (mappedStatus === 'ACTIVE' || mappedStatus === 'TRIALING') {
      await tx.user.update({
        where: { id: userId },
        data: { isSubscribed: true },
      })
    }
  })

  return { processed: true }
}

// ---------- Subscription lifecycle events (updated / deleted / invoice.* / refund) ----------
const handleSubscriptionUpdated = async (stripeSub: Stripe.Subscription) => {
  const sub = await prisma.userSubscription.findUnique({
    where: { stripeSubscriptionId: stripeSub.id },
  })
  if (!sub) return { skipped: true }

  const statusMap: Record<string, 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'INCOMPLETE'> =
    {
      trialing: 'TRIALING',
      active: 'ACTIVE',
      past_due: 'PAST_DUE',
      canceled: 'CANCELED',
      incomplete: 'INCOMPLETE',
      incomplete_expired: 'INCOMPLETE',
      unpaid: 'PAST_DUE',
    }
  const mappedStatus = statusMap[stripeSub.status] ?? sub.status

  const periodStart = stripeSub.items.data[0]?.current_period_start
  const periodEnd = stripeSub.items.data[0]?.current_period_end

  await prisma.userSubscription.update({
    where: { id: sub.id },
    data: {
      status: mappedStatus,
      currentPeriodStart: periodStart ? new Date(periodStart * 1000) : sub.currentPeriodStart,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : sub.currentPeriodEnd,
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      isTrialing: mappedStatus === 'TRIALING',
    },
  })

  return { processed: true }
}

const handleSubscriptionDeleted = async (stripeSub: Stripe.Subscription) => {
  const sub = await prisma.userSubscription.findUnique({
    where: { stripeSubscriptionId: stripeSub.id },
  })
  if (!sub) return { skipped: true }

  await prisma.$transaction([
    prisma.userSubscription.update({
      where: { id: sub.id },
      data: {
        status: sub.status === 'REFUNDED' ? 'REFUNDED' : 'EXPIRED',
        endedAt: new Date(),
      },
    }),
    prisma.user.update({
      where: { id: sub.userId },
      data: { isSubscribed: false },
    }),
  ])

  return { processed: true }
}

const handleInvoicePaymentSucceeded = async (invoice: Stripe.Invoice) => {
  const invoiceCompat = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null
    payment_intent?: string | Stripe.PaymentIntent | null
  }
  const subscriptionId =
    typeof invoiceCompat.subscription === 'string'
      ? invoiceCompat.subscription
      : invoiceCompat.subscription?.id
  if (!subscriptionId) return { skipped: true }

  const sub = await prisma.userSubscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  })
  if (!sub) return { skipped: true }

  await prisma.userSubscription.update({
    where: { id: sub.id },
    data: {
      status: 'ACTIVE',
      isTrialing: false,
    },
  })

  const paymentIntentId =
    typeof invoiceCompat.payment_intent === 'string'
      ? invoiceCompat.payment_intent
      : invoiceCompat.payment_intent?.id

  if (paymentIntentId) {
    const exists = await prisma.paymentTransaction.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
    })
    if (!exists) {
      await prisma.paymentTransaction.create({
        data: {
          amount: new Prisma.Decimal((invoice.amount_paid ?? 0) / 100),
          currency: invoice.currency ?? 'usd',
          status: 'SUCCEEDED',
          type: 'SUBSCRIPTION',
          provider: 'STRIPE',
          stripeCheckoutSessionId: `invoice_${invoice.id}`,
          stripePaymentIntentId: paymentIntentId,
          userId: sub.userId,
          subscriptionId: sub.id,
          metadata: { invoiceId: invoice.id, renewal: true },
        },
      })
    }
  }

  return { processed: true }
}

const handleInvoicePaymentFailed = async (invoice: Stripe.Invoice) => {
  const invoiceWithSub = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null
  }
  const subscriptionId =
    typeof invoiceWithSub.subscription === 'string'
      ? invoiceWithSub.subscription
      : invoiceWithSub.subscription?.id
  if (!subscriptionId) return { skipped: true }

  const sub = await prisma.userSubscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  })
  if (!sub) return { skipped: true }

  await prisma.userSubscription.update({
    where: { id: sub.id },
    data: { status: 'PAST_DUE' },
  })

  return { processed: true }
}

const handleChargeRefunded = async (charge: Stripe.Charge) => {
  const paymentIntentId =
    typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id
  if (!paymentIntentId) return { skipped: true }

  const refund = await prisma.subscriptionRefund.findFirst({
    where: {
      paymentTransaction: { stripePaymentIntentId: paymentIntentId },
      status: 'PENDING',
    },
  })

  if (refund) {
    await prisma.subscriptionRefund.update({
      where: { id: refund.id },
      data: { status: 'SUCCEEDED', processedAt: new Date() },
    })
  }

  return { processed: true }
}

// ---------- Webhook dispatcher ----------
const handleStripeWebhook = async (rawBody: Buffer, signature?: string | string[]) => {
  if (!config.stripe.webhookSecret) {
    throw new AppError(500, 'Stripe webhook secret is not configured')
  }

  if (!signature || Array.isArray(signature)) {
    throw new AppError(400, 'Missing Stripe signature')
  }

  const stripe = getStripeClient()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, config.stripe.webhookSecret)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid Stripe webhook signature'
    throw new AppError(400, `Webhook Error: ${message}`)
  }

  let webhookEvent
  try {
    webhookEvent = await prisma.paymentWebhookEvent.create({
      data: {
        provider: 'STRIPE',
        providerEventId: event.id,
        eventType: event.type,
        payload: event as unknown as Prisma.InputJsonValue,
      },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { received: true, duplicate: true }
    }
    throw error
  }

  const markProcessed = (status: 'PROCESSED' | 'SKIPPED', errorMessage?: string) =>
    prisma.paymentWebhookEvent.update({
      where: { id: webhookEvent.id },
      data: {
        status,
        errorMessage: errorMessage ?? null,
        processedAt: new Date(),
      },
    })

  try {
    let result: { processed?: boolean; skipped?: boolean; alreadyProcessed?: boolean } | undefined

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode === 'subscription') {
          result = await handleSubscriptionCheckoutCompleted(session)
        } else {
          result = await handleShopCheckoutCompleted(session)
        }
        break
      }
      case 'customer.subscription.updated':
        result = await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        result = await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      case 'invoice.payment_succeeded':
        result = await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      case 'invoice.payment_failed':
        result = await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break
      case 'charge.refunded':
        result = await handleChargeRefunded(event.data.object as Stripe.Charge)
        break
      default:
        await markProcessed('SKIPPED')
        return { received: true, skipped: true }
    }

    await markProcessed(result?.skipped ? 'SKIPPED' : 'PROCESSED')
    return { received: true, ...result }
  } catch (error) {
    await prisma.paymentWebhookEvent.update({
      where: { id: webhookEvent.id },
      data: {
        status: 'FAILED',
        errorMessage:
          error instanceof Error ? error.message : 'Unknown webhook processing error',
      },
    })
    throw error
  }
}

export const paymentService = {
  getAllPayments,
  handleStripeWebhook,
}
