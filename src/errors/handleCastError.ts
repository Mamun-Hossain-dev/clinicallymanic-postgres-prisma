import { Prisma } from '@prisma/client'
import { TErrorSources, TGenericErrorResponse } from '../interface/error.interface'

const handlePrismaValidationError = (
  err: Prisma.PrismaClientValidationError
): TGenericErrorResponse => {
  const errorSources: TErrorSources = [
    {
      path: '',
      message: err.message.split('\n').pop() || 'Invalid data provided',
    },
  ]

  const statusCode = 400

  return {
    statusCode,
    message: 'Validation Error',
    errorSources,
  }
}

export default handlePrismaValidationError
