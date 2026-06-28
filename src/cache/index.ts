import { config } from '@/config/env';
import { logger } from '@/lib/logger';
import { getRedisClient } from '@/lib/redis/client';

export type CacheValue = unknown;

export interface CacheProvider {
  get<T = CacheValue>(key: string): Promise<T | null>;
  set<T = CacheValue>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

class MemoryCache implements CacheProvider {
  private store = new Map<string, { value: CacheValue; expiresAt: number | null }>();

  async get<T = CacheValue>(key: string) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T = CacheValue>(key: string, value: T, ttlSeconds?: number) {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value, expiresAt });
  }

  async delete(key: string) {
    this.store.delete(key);
  }

  async clear() {
    this.store.clear();
  }
}

class RedisCache implements CacheProvider {
  async get<T = CacheValue>(key: string) {
    const client = await getRedisClient();
    if (!client) return null;
    try {
      const data = await client.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (err) {
      logger.warn('[Cache][Redis] get failed', err);
      return null;
    }
  }

  async set<T = CacheValue>(key: string, value: T, ttlSeconds?: number) {
    const client = await getRedisClient();
    if (!client) return;
    try {
      const data = JSON.stringify(value);
      if (ttlSeconds && ttlSeconds > 0) {
        await client.setEx(key, ttlSeconds, data);
      } else {
        await client.set(key, data);
      }
    } catch (err) {
      logger.warn('[Cache][Redis] set failed', err);
    }
  }

  async delete(key: string) {
    const client = await getRedisClient();
    if (!client) return;
    try {
      await client.del(key);
    } catch (err) {
      logger.warn('[Cache][Redis] delete failed', err);
    }
  }

  async clear() {
    const client = await getRedisClient();
    if (!client) return;
    try {
      await client.flushDb();
    } catch (err) {
      logger.warn('[Cache][Redis] clear failed', err);
    }
  }
}

const provider: CacheProvider = config.cache.enableRedis ? new RedisCache() : new MemoryCache();

export const cache = provider;

export function cacheKey(...parts: Array<string | number>) {
  return parts.join(':');
}

export default cache;
