import { getRedisClient, isRedisEnabled } from '../config/redis'
import logger from './logger'

const DEFAULT_TTL = 60 * 5 // 5 minutes

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  if (!isRedisEnabled()) return null

  const redis = getRedisClient()
  const data = await redis.get<unknown>(key)

  if (!data) return null

  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as T
    } catch {
      // Legacy/non-JSON string cache data; delete and repopulate from DB on next flow.
      logger.warn(`Cache parse failed for key "${key}"`)
      await redis.del(key)
      return null
    }
  }

  return data as T
}

export const cacheSet = async (key: string, value: unknown, ttl = DEFAULT_TTL) => {
  if (!isRedisEnabled()) return

  const redis = getRedisClient()
  await redis.set(key, value, { ex: ttl })
}

export const cacheDel = async (...keys: string[]) => {
  if (!isRedisEnabled() || keys.length === 0) return

  const redis = getRedisClient()
  await redis.del(...keys)
}

export const cacheIncr = async (key: string) => {
  if (!isRedisEnabled()) return null

  const redis = getRedisClient()
  return redis.incr(key)
}
