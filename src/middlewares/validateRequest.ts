import { NextFunction, Request, Response } from 'express'
import { ZodSchema } from 'zod'
import catchAsync from '../utils/catchAsync'

const validateRequest = (schema: ZodSchema) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const parsed = (await schema.parseAsync({
      body: req.body ?? {},
      query: req.query ?? {},
      params: req.params ?? {},
      cookies: req.cookies ?? {},
    })) as {
      body: Request['body']
      query: Request['query']
      params: Request['params']
      cookies: Request['cookies']
    }

    req.body = parsed.body

    if (parsed.query && typeof parsed.query === 'object') {
      Object.assign(req.query, parsed.query)
    }

    if (parsed.params && typeof parsed.params === 'object') {
      Object.assign(req.params, parsed.params)
    }

    if (parsed.cookies && typeof parsed.cookies === 'object') {
      Object.assign(req.cookies, parsed.cookies)
    }

    next()
  })
}

export default validateRequest
