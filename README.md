# ClinicallyManic Backend API

Production-oriented backend service for the ClinicallyManic platform. The API is built with Express, TypeScript, Prisma, PostgreSQL, Redis, Stripe, Cloudinary, and Swagger, with a modular architecture for authentication, users, content, banners, shop, subscriptions, payments, newsletters, contacts, offers, events, and dashboard analytics.

## Tech Stack

- Node.js + Express 5
- TypeScript
- Prisma ORM + PostgreSQL
- Upstash Redis for read-through caching
- Zod request validation
- JWT authentication and role-based authorization
- Stripe Checkout + Stripe webhooks
- Cloudinary media uploads
- Nodemailer email support
- Winston structured logging
- Swagger/OpenAPI documentation
- Helmet, CORS, rate limiting, and centralized error handling

## Key Features

- Feature-based modular backend structure.
- Central route registry under `/api/v1`.
- Clean controller, service, repository, validation separation.
- Zod schemas validate body, query, params, and cookies before handlers run.
- Prisma schema is split by domain for maintainability.
- PostgreSQL indexes are defined for high-read and high-filter tables.
- Redis caching is implemented for frequently queried public modules.
- Redis-backed webhook idempotency reduces duplicate Stripe event processing.
- Stripe webhook route is mounted before JSON parsing to preserve raw payload verification.
- Global error handling normalizes Prisma, Zod, validation, duplicate, and cast errors.
- Cron jobs support subscription lifecycle maintenance.
- Swagger docs are enabled in development mode.

## Modules

All routes are mounted under `/api/v1`.

- `/auth` - registration, login, tokens, OTP/password flows
- `/users` - user profile and admin user management
- `/banners` - website banners with Redis caching
- `/contents` - articles, YouTube content, Spotify content with Redis caching
- `/shop` - products, checkout, orders with product Redis caching
- `/subscriptions` - subscription plans, checkout, refunds, cancel/resume flows
- `/payments` - payment listing and Stripe webhook handling
- `/dashboard` - admin dashboard metrics
- `/contacts` - contact messages
- `/offers` - promotional offers
- `/events` - event management
- `/newsletters` - newsletter subscriptions

## Scalability And Performance Practices

### Redis Caching

Frequently requested website data uses Redis read-through caching with 5-minute TTLs.

- Banner details: `banner:id:{id}`
- Banner lists: `banner:list:v{version}:{queryPayload}`
- Content details: `content:id:{id}`
- Content lists: `content:list:v{version}:{queryPayload}`
- Shop product details: `shop:product:id:{id}`
- Shop product lists: `shop:product:list:v{version}:{queryPayload}`

List caches use a version key instead of expensive key scanning. On create, update, or delete, the module updates the list version key, so old list cache entries naturally expire while new requests build fresh keys.

Each cache-enabled module logs cache hit/miss and timing information such as `totalMs` and `dbMs`. This lets us measure the real speed gain in production instead of guessing a percentage. On cache hit, the API skips the PostgreSQL query and returns the Redis value directly.

### Stripe Webhook Idempotency

Stripe webhook handling uses a two-layer idempotency strategy.

- PostgreSQL stores every received Stripe event in `payment_webhook_events` with a unique `providerEventId`.
- Redis creates a short-lived `stripe:webhook:event:{eventId}:processing` lock before DB processing starts.
- Redis stores a longer-lived `stripe:webhook:event:{eventId}:processed` marker after successful or skipped processing.
- Concurrent duplicate deliveries can return early from Redis instead of racing into database writes.
- The database unique constraint remains the durable source of truth if Redis is disabled, cold, or expired.

This pattern protects payment, order, and subscription updates from double-processing while still allowing failed webhook attempts to release the Redis processing lock for safe retry behavior.

### Database Indexing

The Prisma schema includes indexes for common filtering, sorting, and ownership checks.

- `users`: `@@index([verified, isSubscribed])`, `@@index([createdAt(sort: Desc)])`
- `banners`: `@@index([createdById])`, `@@index([category, status])`
- `contents`: `@@index([createdById])`, `@@index([type, category])`, `@@index([createdAt(sort: Desc)])`
- `shop_products`: `@@index([createdById])`, `@@index([status, type])`, `@@index([createdAt(sort: Desc)])`
- `shop_orders`: `@@index([userId, status])`, `@@index([productId])`, `@@index([createdAt(sort: Desc)])`
- `payment_transactions`: indexes for user, order, product, subscription, and recent payment queries
- `subscription_plans`: `@@index([isActive, sortOrder])`, `@@unique([name, interval])`
- `user_subscriptions`: `@@index([userId, status])`, `@@index([status, currentPeriodEnd])`, `@@index([deletedAt])`
- `subscription_refunds`: `@@index([subscriptionId, status])`

These indexes support the API's common patterns: paginated list queries, admin filters, current-user data lookup, subscription status checks, and newest-first sorting.

### Subscription Create API Fix

Subscription plan creation now supports multiple billing variants for the same plan name. Previously `SubscriptionPlan.name` was globally unique, so a plan like `exclusive` could not have both monthly and yearly versions. The schema now uses a composite unique constraint on `name + interval`, and the service checks duplicates using the same rule.

Example allowed combinations:

- `exclusive` + `MONTHLY`
- `exclusive` + `YEARLY`
- `basic` + `WEEKLY`

A duplicate such as another `exclusive` + `MONTHLY` is still rejected.

### API And Backend Best Practices

- Controllers only parse request context and shape responses.
- Services contain business rules such as subscription eligibility, cache invalidation, upload handling, and authorization checks.
- Repositories isolate Prisma database calls.
- Request validation is centralized with Zod.
- Errors are thrown with `AppError` and formatted globally.
- Stripe checkout rows are seeded as pending transactions, then webhook events update payment and subscription state.
- Webhook handling is idempotent with Redis in-flight locks plus durable database event IDs.
- Media replacement deletes old Cloudinary assets to avoid orphaned files.
- Auth middleware supports role-protected routes.
- Feature-gating middleware can check active subscription plan features.
- Rate limiting and Helmet are applied globally.
- Prisma `$transaction` is used where related payment/order/subscription writes must stay consistent.

## Project Structure

```text
prisma/
├── migrations/         # Prisma migration history
└── schema/             # Split Prisma schema files by domain

src/
├── config/             # Environment, Redis, Swagger configuration
├── cron/               # Scheduled jobs
├── errors/             # Custom error helpers
├── interface/          # Shared interfaces
├── lib/                # Prisma client setup
├── middlewares/        # Auth, validation, request logging, errors
├── modules/            # Feature modules
│   ├── auth/
│   ├── banner/
│   ├── contact/
│   ├── content/
│   ├── dashboard/
│   ├── event/
│   ├── newsletter/
│   ├── offer/
│   ├── payment/
│   ├── shop/
│   ├── subscription/
│   └── user/
├── routes/             # Central route registry
├── utils/              # Shared helpers
├── app.ts              # Express app configuration
└── server.ts           # Server bootstrap
```

## Local Setup

1. Install dependencies.

```bash
npm install
```

2. Create `.env` in the backend root.

```env
NODE_ENV=development
PORT=5000

DATABASE_URL=postgresql://username:password@localhost:5432/clinicallymanic?schema=public
DIRECT_URL=postgresql://username:password@localhost:5432/clinicallymanic?schema=public

CLIENT_URL=http://localhost:3000

BCRYPT_SALT_ROUNDS=10

ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
ACCESS_TOKEN_EXPIRES_IN=1d
REFRESH_TOKEN_EXPIRES_IN=365d

EMAIL_FROM=example@email.com
EMAIL_USER=example@email.com
EMAIL_PASS=your_email_password
EMAIL_PORT=587
EMAIL_HOST=smtp.gmail.com

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret

REDIS_ENABLED=false
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

COOKIE_SECRET=your_cookie_secret
```

3. Generate Prisma client.

```bash
npm run prisma:generate
```

4. Run migrations.

```bash
npm run prisma:migrate
```

5. Start development server.

```bash
npm run dev
```

Development URLs:

- API root: `http://localhost:5000`
- Swagger UI: `http://localhost:5000/api/v1/docs`
- OpenAPI JSON: `http://localhost:5000/api/v1/docs.json`

## Redis Setup

Redis is optional and controlled by environment variables.

```env
REDIS_ENABLED=true
UPSTASH_REDIS_REST_URL=your_upstash_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_rest_token
```

When Redis is disabled, cache helpers return safely and the API continues to use PostgreSQL directly.

## Scripts

- `npm run dev` - start the development server with hot reload
- `npm run build` - generate Prisma client and compile TypeScript
- `npm start` - run compiled server from `dist`
- `npm run prisma:generate` - generate Prisma client
- `npm run prisma:migrate` - run development migrations
- `npm run prisma:studio` - open Prisma Studio
- `npm run lint` - run ESLint
- `npm run lint:fix` - fix ESLint issues
- `npm run format` - format TypeScript source files

## Production Notes

- Run `npm run build` before deployment.
- Run Prisma migrations before starting the production server.
- Configure Stripe webhook forwarding to `/api/v1/payments/webhooks/stripe`.
- Keep `REDIS_ENABLED=true` in production when Upstash credentials are available.
- Use strong JWT and cookie secrets.
- Keep Swagger enabled only in development.

## License

ISC
