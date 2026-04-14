import { NextFunction, Request, Response } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'
import config from '../config'
import AppError from '../errors/AppError'
import catchAsync from '../utils/catchAsync'

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload | null
    }
  }
}

const auth = (...requiredRoles: string[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      throw new AppError(401, 'You are not authorized!')
    }

    try {
      const decoded = jwt.verify(token, config.jwt.accessSecret as string) as JwtPayload

      if (requiredRoles.length && !requiredRoles.includes(decoded.role)) {
        throw new AppError(403, 'You are not authorized to perform this action!')
      }

      req.user = decoded
      next()
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError(401, 'Unauthorized')
    }
  })
}

export default auth
