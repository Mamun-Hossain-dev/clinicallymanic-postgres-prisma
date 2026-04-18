import cron from 'node-cron'
import prisma from '../lib/prisma'
import logger from '../utils/logger'
import { SUBSCRIPTION_CONFIG } from '../modules/subscription/subscription.constants'

/**
 * Subscription maintenance cron. Runs daily at 02:00 server time.
 *  1. Expire ACTIVE/TRIALING/PAST_DUE subscriptions whose currentPeriodEnd has passed.
 *  2. Soft-delete CANCELED/EXPIRED/REFUNDED subscriptions that have been in that state
 *     for longer than SOFT_DELETE_AFTER_DAYS.
 *
 * Stripe webhooks are the primary source of truth; this cron is a safety net
 * for cases where webhooks were missed or Stripe billing ran out of retries.
 */
const runSubscriptionMaintenance = async () => {
  const now = new Date()
  const softDeleteCutoff = new Date(
    now.getTime() - SUBSCRIPTION_CONFIG.SOFT_DELETE_AFTER_DAYS * 24 * 60 * 60 * 1000
  )

  try {
    // 1. Expire subscriptions whose period has ended
    const expiredResult = await prisma.userSubscription.updateMany({
      where: {
        deletedAt: null,
        status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
        currentPeriodEnd: { lt: now, not: null },
        cancelAtPeriodEnd: true,
      },
      data: {
        status: 'EXPIRED',
        endedAt: now,
      },
    })

    // Also flip users.isSubscribed when their last active sub just expired
    if (expiredResult.count > 0) {
      const affected = await prisma.userSubscription.findMany({
        where: {
          status: 'EXPIRED',
          endedAt: { gte: new Date(now.getTime() - 10 * 60 * 1000) },
        },
        select: { userId: true },
      })

      const userIds = [...new Set(affected.map(s => s.userId))]
      for (const userId of userIds) {
        const stillActive = await prisma.userSubscription.count({
          where: {
            userId,
            deletedAt: null,
            status: { in: ['ACTIVE', 'TRIALING'] },
          },
        })
        if (stillActive === 0) {
          await prisma.user.update({
            where: { id: userId },
            data: { isSubscribed: false },
          })
        }
      }
    }

    // 2. Soft-delete long-terminated subscriptions
    const softDeleted = await prisma.userSubscription.updateMany({
      where: {
        deletedAt: null,
        status: { in: ['CANCELED', 'EXPIRED', 'REFUNDED'] },
        OR: [
          { endedAt: { lt: softDeleteCutoff } },
          { canceledAt: { lt: softDeleteCutoff }, endedAt: null },
        ],
      },
      data: { deletedAt: now },
    })

    logger.info(
      `[subscription-cron] expired=${expiredResult.count} softDeleted=${softDeleted.count}`
    )
  } catch (error) {
    logger.error('[subscription-cron] maintenance failed', error)
  }
}

export const startSubscriptionCron = () => {
  // Daily at 02:00
  cron.schedule('0 2 * * *', runSubscriptionMaintenance, {
    timezone: 'UTC',
  })
  logger.info('[subscription-cron] scheduled daily at 02:00 UTC')
}

// Exported for manual / test invocation
export const _runSubscriptionMaintenance = runSubscriptionMaintenance
