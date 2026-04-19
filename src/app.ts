import cookieParser from 'cookie-parser'
import cors from 'cors'
import express, { Request, Response } from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import swaggerUi from 'swagger-ui-express'
import config from './config'
import { swaggerSpec } from './config/swagger'
import globalErrorHandler from './middlewares/globalErrorHandler'
import notFound from './middlewares/notFound'
import { paymentController } from './modules/payment/payment.controller'
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
app.post(
  '/api/v1/payments/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  paymentController.handleStripeWebhook
)
app.use(express.json({ limit: '25kb' }))
app.use(express.urlencoded({ extended: true, limit: '50kb' }))
app.use(cookieParser(config.cookieSecret))

// application routes(centralized router)
app.use('/api/v1', router)

// ── Swagger API Docs (Development only) ──────────────────────────────────────
if (config.env === 'development') {
  // Disable CSP only for swagger docs route so swagger-ui assets load correctly
  app.use(
    '/api/v1/docs',
    (_req, _res, next) => {
      // Allow swagger-ui inline scripts & styles
      next()
    },
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'ClinicallyManic API Docs',
      customCss: `
        .swagger-ui .topbar { background-color: #1a1a2e; }
        .swagger-ui .topbar .download-url-wrapper { display: none; }
        .swagger-ui .info .title { color: #6c63ff; }
      `,
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
      },
    })
  )

  // Serve raw OpenAPI JSON spec
  app.get('/api/v1/docs.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json')
    res.send(swaggerSpec)
  })
}

// Root route
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the API!',
    ...(config.env === 'development' && {
      docs: `http://localhost:${config.port}/api/v1/docs`,
    }),
  })
})

// not found error handler
app.use(notFound)

// global error handler
app.use(globalErrorHandler)

export default app
