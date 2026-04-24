import { NextFunction, Request, Response } from 'express'
import AppError from '../errors/AppError'

const parseData = (req: Request, res: Response, next: NextFunction) => {
  if (!req.body?.data) {
    return next()
  }

  try {
    req.body = { ...req.body, ...JSON.parse(req.body.data) }
    delete req.body.data
    return next()
  } catch {
    return next(new AppError(400, 'Invalid JSON format in "data" field'))
  }
}

export default parseData
