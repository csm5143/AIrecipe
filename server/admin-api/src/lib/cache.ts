/**
 * 内存缓存模块
 * 使用 Map 存储，带 TTL 过期机制
 * 进程重启后缓存丢失，适合单实例部署
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export interface CacheClient {
  getOrSet<T>(key: string, ttlSeconds: number, source: () => Promise<T>): Promise<T>;
  del(keys: string | string[]): Promise<void>;
  delByPattern(pattern: string): Promise<void>;
}

const memoryCache = new Map<string, CacheEntry<any>>();

function isExpired(entry: CacheEntry<any>): boolean {
  return Date.now() > entry.expiresAt;
}

export const cache: CacheClient = {
  async getOrSet<T>(key: string, ttlSeconds: number, source: () => Promise<T>): Promise<T> {
    const existing = memoryCache.get(key);
    if (existing && !isExpired(existing)) {
      return existing.data as T;
    }

    const fresh = await source();
    memoryCache.set(key, {
      data: fresh,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    return fresh;
  },

  async del(keys: string | string[]): Promise<void> {
    const list = Array.isArray(keys) ? keys : [keys];
    for (const key of list) {
      memoryCache.delete(key);
    }
  },

  async delByPattern(pattern: string): Promise<void> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of memoryCache.keys()) {
      if (regex.test(key)) {
        memoryCache.delete(key);
      }
    }
  },
};
