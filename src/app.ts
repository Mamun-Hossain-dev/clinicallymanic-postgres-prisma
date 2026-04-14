import cookieParser from 'cookie-parser'
import cors from 'cors'
import express, { Request, Response } from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import config from './config'
import globalErrorHandler from './middlewares/globalErrorHandler'
import notFound from './middlewares/notFound'
import router from './routes'

const app = express()

// global middlewares
app.use(helmet())
app.use(
  cors({
    origin: process.env.environment === 'production' ? config.clientUrl : '*',
    credentials: true,
  })
)
app.use(
  rateLimit({
    windowMs: Number(config.rateLimit.window),
    max: Number(config.rateLimit.max),
  })
)
app.use(express.json({ limit: '25kb' }))
app.use(express.urlencoded({ extended: true, limit: '50kb' }))
app.use(cookieParser(config.cookieSecret))

// application routes(centralized router)
app.use('/api/v1', router)

// Root route
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the API!',
  })
})

// not found error handler
app.use(notFound)

// global error handler
app.use(globalErrorHandler)

export default app
