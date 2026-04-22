import { NextFunction, Request, Response } from 'express'
import logger from '../utils/logger'

const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = process.hrtime.bigint()

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startTime) / 1_000_000
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      'unknown'

    const message =
      `[API] ${req.method} ${req.originalUrl} ${res.statusCode} ` +
      `- ${durationMs.toFixed(2)} ms - ${ip}`

    if (res.statusCode >= 500) {
      logger.error(message)
      return
    }

    logger.info(message)
  })

  next()
}

export default requestLogger
