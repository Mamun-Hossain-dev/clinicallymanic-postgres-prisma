import { Prisma } from '@prisma/client'
import { TErrorSources, TGenericErrorResponse } from '../interface/error.interface'

const handleDuplicateError = (
  err: Prisma.PrismaClientKnownRequestError
): TGenericErrorResponse => {
  // P2002 is Prisma's unique constraint violation error code
  const target = (err.meta?.target as string[]) || []
  const field = target.join(', ')

  const errorSources: TErrorSources = [
    {
      path: field,
      message: `${field} already exists`,
    },
  ]

  const statusCode = 409

  return {
    statusCode,
    message: 'Duplicate Entry',
    errorSources,
  }
}

export default handleDuplicateError
