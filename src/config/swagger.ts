import path from 'path'
import swaggerJsdoc from 'swagger-jsdoc'
import config from './index'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ClinicallyManic API',
      version: '1.0.0',
      description: `
## ClinicallyManic REST API Documentation

A production-grade Node.js + Express + TypeScript + PostgreSQL + Prisma API.

### Authentication
This API uses **JWT Bearer Token** authentication.  
1. Register or Login via \`/api/v1/auth\`  
2. Copy the \`accessToken\` from the response  
3. Click **Authorize** and paste: \`Bearer <your_token>\`

### Base URL
\`http://localhost:${config.port}/api/v1\`
      `,
      contact: {
        name: 'Mamun Hossain',
        email: 'support@clinicallymanic.com',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api/v1`,
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token: **Bearer &lt;token&gt;**',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'refreshToken',
          description: 'Refresh token stored in HTTP-only cookie',
        },
      },
      schemas: {
        // ─── Generic Response Wrappers ───────────────────────────────────
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Something went wrong' },
            errorSources: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  path: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
            stack: {
              type: 'string',
              description: 'Stack trace (development only)',
            },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            total: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 10 },
          },
        },
        // ─── User ────────────────────────────────────────────────────────
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: 'a1b2c3d4-...' },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            role: { type: 'string', enum: ['ADMIN', 'USER', 'GUEST'], example: 'USER' },
            profileImage: { type: 'string', format: 'uri', nullable: true },
            bio: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
            location: { type: 'string', nullable: true },
            isVerified: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // ─── Auth Tokens ─────────────────────────────────────────────────
        AuthTokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
          },
        },
        // ─── Banner ──────────────────────────────────────────────────────
        Banner: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string', example: 'Summer Sale' },
            subtitle: { type: 'string', nullable: true },
            description: { type: 'string', nullable: true },
            bannerImage: { type: 'string', format: 'uri', nullable: true },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // ─── Event ───────────────────────────────────────────────────────
        Event: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string', example: 'Mental Health Webinar' },
            description: { type: 'string', nullable: true },
            thumbnail: { type: 'string', format: 'uri', nullable: true },
            eventDate: { type: 'string', format: 'date-time' },
            location: { type: 'string', nullable: true },
            isOnline: { type: 'boolean', example: true },
            registrationLink: { type: 'string', format: 'uri', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // ─── Offer ───────────────────────────────────────────────────────
        Offer: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string', example: '50% Off Subscription' },
            description: { type: 'string', nullable: true },
            thumbnail: { type: 'string', format: 'uri', nullable: true },
            discountPercent: { type: 'number', example: 50 },
            validUntil: { type: 'string', format: 'date-time', nullable: true },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // ─── Content ─────────────────────────────────────────────────────
        Content: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string', example: 'Understanding Anxiety' },
            body: { type: 'string' },
            thumbnail: { type: 'string', format: 'uri', nullable: true },
            category: { type: 'string', nullable: true },
            isPublished: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // ─── Contact ─────────────────────────────────────────────────────
        Contact: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Jane Doe' },
            email: { type: 'string', format: 'email' },
            subject: { type: 'string', example: 'General Inquiry' },
            message: { type: 'string' },
            isRead: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // ─── Newsletter ───────────────────────────────────────────────────
        Newsletter: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            isSubscribed: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // ─── Shop Product ─────────────────────────────────────────────────
        ShopProduct: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Anxiety Relief Kit' },
            description: { type: 'string', nullable: true },
            price: { type: 'number', format: 'float', example: 29.99 },
            stock: { type: 'integer', example: 100 },
            images: {
              type: 'array',
              items: { type: 'string', format: 'uri' },
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // ─── Subscription Plan ────────────────────────────────────────────
        SubscriptionPlan: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Pro Monthly' },
            description: { type: 'string', nullable: true },
            price: { type: 'number', example: 9.99 },
            interval: { type: 'string', enum: ['month', 'year'], example: 'month' },
            features: {
              type: 'array',
              items: { type: 'string' },
              example: ['Unlimited access', 'Priority support'],
            },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // ─── Payment ─────────────────────────────────────────────────────
        Payment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            amount: { type: 'number', example: 9.99 },
            currency: { type: 'string', example: 'usd' },
            status: {
              type: 'string',
              enum: ['pending', 'succeeded', 'failed', 'refunded'],
              example: 'succeeded',
            },
            stripePaymentIntentId: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // ─── Common Params ────────────────────────────────────────────────
        UuidParam: {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Resource UUID',
        },
      },
    },
  },
  apis: [
    path.join(__dirname, '../modules/**/*.routes.ts'),
    path.join(__dirname, '../modules/**/*.routes.js'), // for compiled output
  ],
}

export const swaggerSpec = swaggerJsdoc(options)
