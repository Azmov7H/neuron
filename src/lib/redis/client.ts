import { createClient, type RedisClientType } from 'redis';
import { config } from '@/config/env';
import { logger } from '@/lib/logger';

declare global {
  var __neuronRedisClient: RedisClientType | null | undefined;
  var __neuronRedisPromise: Promise<RedisClientType | null> | null | undefined;
}

const globalWithRedis = globalThis as typeof globalThis & {
  __neuronRedisClient?: RedisClientType | null;
  __neuronRedisPromise?: Promise<RedisClientType | null>;
};

export async function getRedisClient(): Promise<RedisClientType | null> {
  if (!config.cache.enableRedis) {
    return null;
  }

  if (globalWithRedis.__neuronRedisClient?.isOpen) {
    return globalWithRedis.__neuronRedisClient;
  }

  if (globalWithRedis.__neuronRedisPromise) {
    return globalWithRedis.__neuronRedisPromise;
  }

  globalWithRedis.__neuronRedisPromise = (async () => {
    try {
      const client = createClient({ url: config.cache.redisUrl });

      client.on('error', (error) => {
        logger.warn('[Redis] Client error', error);
      });

      await client.connect();
      globalWithRedis.__neuronRedisClient = client;
      logger.info('[Redis] Connected');
      return client;
    } catch (error) {
      logger.warn('[Redis] Connection failure, falling back to memory rate limiter', error);
      globalWithRedis.__neuronRedisClient = null;
      return null;
    } finally {
      // Clear the in-flight promise; use `undefined` to match the declared type
      globalWithRedis.__neuronRedisPromise = undefined;
    }
  })();

  return globalWithRedis.__neuronRedisPromise;
}

export async function getRateLimitData(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ count: number; resetAt: number; allowed: boolean } | null> {
  const client = await getRedisClient();
  if (!client) return null;

  try {
    const redisKey = `rate_limit:${key}`;
    const count = await client.incr(redisKey);

    if (count === 1) {
      await client.expire(redisKey, Math.ceil(windowMs / 1000));
    }

    const ttl = await client.ttl(redisKey);
    const resetAt = Date.now() + (ttl > 0 ? ttl * 1000 : windowMs);
    return { count, resetAt, allowed: count <= limit };
  } catch (error) {
    logger.warn('[Redis] Rate limit operation failed, falling back to memory store', error);
    return null;
  }
}
