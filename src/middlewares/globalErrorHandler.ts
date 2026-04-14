/* eslint-disable @typescript-eslint/no-unused-vars */

import { ErrorRequestHandler } from 'express'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'
import config from '../config'
import AppError from '../errors/AppError'
import handleDuplicateError from '../errors/handleDuplicateError'
import handlePrismaKnownError from '../errors/handleValidationError'
import handlePrismaValidationError from '../errors/handleCastError'
import handleZodError from '../errors/handleZodError'
import { TErrorSources } from '../interface/error.interface'
import logger from '../utils/logger'

const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  logger.error(err)

  let statusCode = 500
  let message = 'Something went wrong!'
  let errorSources: TErrorSources = [
    {
      path: '',
      message: 'Something went wrong',
    },
  ]

  if (err instanceof ZodError) {
    const simplifiedError = handleZodError(err)
    statusCode = simplifiedError?.statusCode
    message = simplifiedError?.message
    errorSources = simplifiedError?.errorSources
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      // Unique constraint violation
      const simplifiedError = handleDuplicateError(err)
      statusCode = simplifiedError?.statusCode
      message = simplifiedError?.message
      errorSources = simplifiedError?.errorSources
    } else if (err.code === 'P2025') {
      // Record not found
      statusCode = 404
      message = 'Record not found'
      errorSources = [
        {
          path: '',
          message: (err.meta?.cause as string) || 'The requested record was not found',
        },
      ]
    } else {
      const simplifiedError = handlePrismaKnownError(err)
      statusCode = simplifiedError?.statusCode
      message = simplifiedError?.message
      errorSources = simplifiedError?.errorSources
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    const simplifiedError = handlePrismaValidationError(err)
    statusCode = simplifiedError?.statusCode
    message = simplifiedError?.message
    errorSources = simplifiedError?.errorSources
  } else if (err instanceof AppError) {
    statusCode = err?.statusCode
    message = err.message
    errorSources = [
      {
        path: '',
        message: err?.message,
      },
    ]
  } else if (err instanceof Error) {
    message = err.message
    errorSources = [
      {
        path: '',
        message: err?.message,
      },
    ]
  }

  return res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    stack: config.env === 'development' ? err?.stack : null,
  })
}

export default globalErrorHandler
