import { PlanFeature } from '@prisma/client'
import { NextFunction, Request, Response } from 'express'
import AppError from '../errors/AppError'
import { subscriptionService } from '../modules/subscription/subscription.service'
import catchAsync from '../utils/catchAsync'

/**
 * Gate a route behind a subscription feature.
 * Admins bypass the check.
 * Example: router.get('/ai-chat', auth(), requireFeature('AI_CHAT_ACCESS'), handler)
 */
const requireFeature = (feature: PlanFeature) => {
  return catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
    const userId = req.user?.id as string | undefined
    const role = req.user?.role as string | undefined

    if (!userId) throw new AppError(401, 'You are not authorized')
    if (role === 'ADMIN') return next()

    const allowed = await subscriptionService.userHasFeature(userId, feature)
    if (!allowed) {
      throw new AppError(
        403,
        `Your subscription does not include access to ${feature}. Please upgrade your plan.`
      )
    }

    next()
  })
}

export default requireFeature
