/**
 * Import Cache
 * Decouples the import pipeline from any specific cache backend.
 * The in-memory implementation is safe for single-instance imports;
 * swap the singleton in `getCache()` for a Redis-backed adapter to
 * share cache across instances and survive restarts.
 */

export interface ICacheStore {
  readonly name: string;
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  has(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

class InMemoryCache implements ICacheStore {
  readonly name = 'in-memory';
  private store = new Map<string, { value: unknown; expiresAt: number }>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds = 3600): Promise<void> {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async has(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

// ── Singleton accessor ──────────────────────
// Replace with a Redis-backed implementation (same ICacheStore shape)
// to enable cross-instance caching and background indexing coordination.

let activeCache: ICacheStore | null = null;

export function getCache(): ICacheStore {
  if (!activeCache) {
    activeCache = new InMemoryCache();
  }
  return activeCache;
}
