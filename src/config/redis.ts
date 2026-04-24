import { Redis } from '@upstash/redis'
import config from '.'

let redisClient: Redis | null = null

const assertRedisEnv = () => {
  if (!config.redis.enabled) {
    throw new Error('Redis is disabled. Set REDIS_ENABLED=true to use Redis.')
  }

  if (!config.redis.url || !config.redis.token) {
    throw new Error(
      'Missing Redis credentials. Provide UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.'
    )
  }
}

export const isRedisEnabled = () => config.redis.enabled

export const getRedisClient = () => {
  assertRedisEnv()

  if (!redisClient) {
    redisClient = new Redis({
      url: config.redis.url!,
      token: config.redis.token!,
    })
  }

  return redisClient
}

export const verifyRedisConnection = async () => {
  if (!config.redis.enabled) {
    return
  }

  const redis = getRedisClient()
  const healthKey = `health:redis:${process.pid}`

  await redis.set(healthKey, 'ok', { ex: 30 })
  const value = await redis.get<string>(healthKey)

  if (value !== 'ok') {
    throw new Error('Redis health check failed')
  }

  await redis.del(healthKey)
}

