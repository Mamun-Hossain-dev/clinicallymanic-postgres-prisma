import dotenv from 'dotenv'
import path from 'path'
import { z } from 'zod'

dotenv.config({ path: path.join(process.cwd(), '.env') })

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().min(1, 'Database URL is required'),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(10),
  ACCESS_TOKEN_SECRET: z.string().min(1, 'Access token secret is required'),
  REFRESH_TOKEN_SECRET: z.string().min(1, 'Refresh token secret is required'),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default('1d'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('365d'),
  EMAIL_FROM: z.string().email().optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
  EMAIL_PORT: z.coerce.number().optional(),
  EMAIL_HOST: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  RATE_LIMIT_WINDOW: z.coerce.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  COOKIE_SECRET: z.string().optional(),
})

const parseEnv = envSchema.safeParse(process.env)

if (!parseEnv.success) {
  console.error('Invalid environment variables:', JSON.stringify(parseEnv.error.format(), null, 4))
  process.exit(1)
}

const envVars = parseEnv.data

export default {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  databaseUrl: envVars.DATABASE_URL,
  clientUrl: envVars.CLIENT_URL,
  bcryptSaltRounds: envVars.BCRYPT_SALT_ROUNDS,
  jwt: {
    accessSecret: envVars.ACCESS_TOKEN_SECRET,
    refreshSecret: envVars.REFRESH_TOKEN_SECRET,
    accessExpiresIn: envVars.ACCESS_TOKEN_EXPIRES_IN,
    refreshExpiresIn: envVars.REFRESH_TOKEN_EXPIRES_IN,
  },
  email: {
    from: envVars.EMAIL_FROM,
    user: envVars.EMAIL_USER,
    pass: envVars.EMAIL_PASS,
    port: envVars.EMAIL_PORT,
    host: envVars.EMAIL_HOST,
  },
  cloudinary: {
    cloudName: envVars.CLOUDINARY_CLOUD_NAME,
    apiKey: envVars.CLOUDINARY_API_KEY,
    apiSecret: envVars.CLOUDINARY_API_SECRET,
  },
  rateLimit: {
    window: envVars.RATE_LIMIT_WINDOW,
    max: envVars.RATE_LIMIT_MAX,
  },
  cookieSecret: envVars.COOKIE_SECRET,
}
