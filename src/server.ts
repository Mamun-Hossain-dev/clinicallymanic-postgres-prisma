import { Server } from 'http'
import app from './app'
import config from './config'
import { isRedisEnabled, verifyRedisConnection } from './config/redis'
import { startCronJobs } from './cron'
import prisma from './lib/prisma'
import logger from './utils/logger'

let server: Server

const main = async () => {
  try {
    await prisma.$connect()
    logger.info('Connected to the database successfully')

    if (isRedisEnabled()) {
      await verifyRedisConnection()
      logger.info('Connected to Upstash Redis successfully')
    }

    server = app.listen(config.port, () => {
      console.log(`Server is running on http://localhost:${config.port}`)

      if (config.env === 'development') {
        console.log(`Swagger: http://localhost:${config.port}/api/v1/docs`)
      }
    })

    startCronJobs()
  } catch (error) {
    logger.error('Failed to connect to the database', error)
    process.exit(1)
  }
}

main()

process.on('unhandledRejection', err => {
  logger.error(`Unhandled Rejection is detected, shutting down ...`, err)
  if (server) {
    server.close(() => {
      process.exit(1)
    })
  } else {
    process.exit(1)
  }
})

process.on('uncaughtException', err => {
  logger.error(`Uncaught Exception is detected, shutting down ...`, err)
  process.exit(1)
})

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...')
  await prisma.$disconnect()
  if (server) {
    server.close(() => {
      process.exit(0)
    })
  }
})

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...')
  await prisma.$disconnect()
  if (server) {
    server.close(() => {
      process.exit(0)
    })
  }
})
