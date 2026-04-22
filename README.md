# ClinicallyManic Backend API

Backend service for the ClinicallyManic platform. This project is built with Express, TypeScript, Prisma, and PostgreSQL, and exposes REST APIs for authentication, users, content, banners, offers, events, subscriptions, payments, and the admin dashboard.

## Tech Stack

- Node.js
- Express 5
- TypeScript
- Prisma ORM
- PostgreSQL
- Zod
- JWT authentication
- Swagger UI
- Winston logger
- Stripe
- Cloudinary
- Nodemailer

## Key Features

- Modular feature-based backend structure
- Prisma + PostgreSQL database integration
- Zod-based request validation
- JWT auth with access and refresh tokens
- Role/feature-based middleware support
- Stripe webhook support for payments
- Swagger API documentation in development mode
- Centralized error handling
- Rate limiting, CORS, Helmet, and cookie parsing
- Cron job support for subscription-related tasks

## Project Structure

```text
prisma/
├── migrations/         # Prisma migration history
└── schema/             # Split Prisma schema files by domain

src/
├── config/         # Env config and Swagger config
├── cron/           # Scheduled jobs
├── errors/         # Custom error helpers
├── interface/      # Shared interfaces
├── lib/            # Prisma client setup
├── middlewares/    # Auth, validation, error handling, etc.
├── modules/        # Feature modules
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
├── routes/         # Central route registry
├── utils/          # Shared helpers
├── app.ts          # Express app configuration
└── server.ts       # Server bootstrap

package.json
README.md
```

## Available Modules

All routes are mounted under `/api/v1`.

- `/auth`
- `/users`
- `/banners`
- `/contacts`
- `/offers`
- `/events`
- `/newsletters`
- `/contents`
- `/shop`
- `/payments`
- `/subscriptions`
- `/dashboard`

## Local Setup

1. Clone the repository and move into the backend folder.

```bash
git clone <repository-url>
cd clinicallymanic-project/clinicallymanic-postgres-prisma
```

2. Install dependencies.

```bash
npm install
```

3. Create a `.env` file in the project root and add the required environment variables.

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

RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

COOKIE_SECRET=your_cookie_secret
```

4. Generate the Prisma client.

```bash
npx prisma generate
```

5. Run migrations.

```bash
npx prisma migrate dev
```

6. Start the development server.

```bash
npm run dev
```

After the server starts, you should see:

```text
Server is running on http://localhost:5000
Swagger: http://localhost:5000/api/v1/docs
```

## API Docs

Swagger is available only in development mode.

- Swagger UI: `http://localhost:5000/api/v1/docs`
- OpenAPI JSON: `http://localhost:5000/api/v1/docs.json`

The root route also returns a small health-style response:

- `GET /`

## Scripts

- `npm run dev` - Start the development server with hot reload
- `npm run build` - Generate Prisma client and compile TypeScript
- `npm start` - Run the compiled server from `dist`
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run Prisma development migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix lint issues
- `npm run format` - Format TypeScript source files

## Notes

- Swagger routes are enabled only when `NODE_ENV=development`.
- Stripe webhook endpoint is mounted before JSON parsing at `/api/v1/payments/webhooks/stripe`.
- A PostgreSQL database is required to boot the app successfully.
- `DATABASE_URL` and `DIRECT_URL` are both required by the current config.
- Cron jobs are initialized when the server starts.

## Build For Production

```bash
npm run build
npm start
```

## License

ISC
