import { Prisma } from '@prisma/client'
import { TErrorSources, TGenericErrorResponse } from '../interface/error.interface'

const handlePrismaKnownError = (
  err: Prisma.PrismaClientKnownRequestError
): TGenericErrorResponse => {
  const errorSources: TErrorSources = [
    {
      path: '',
      message: err.message,
    },
  ]

  const statusCode = 400

  return {
    statusCode,
    message: 'Validation Error',
    errorSources,
  }
}

export default handlePrismaKnownError
