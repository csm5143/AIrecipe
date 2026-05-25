/**
 * 内存缓存模块
 * 使用 Map 存储，带 TTL 过期机制 + LRU 淘汰 + 前缀索引
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

const MAX_SIZE = 1000;
const memoryCache = new Map<string, CacheEntry<any>>();
// prefixIndex: maps colon-separated prefix to set of cache keys starting with that prefix
const prefixIndex = new Map<string, Set<string>>();

function isExpired(entry: CacheEntry<any>): boolean {
  return Date.now() > entry.expiresAt;
}

function registerPrefix(key: string): void {
  const segments = key.split(':');
  for (let i = 1; i <= segments.length; i++) {
    const prefix = segments.slice(0, i).join(':');
    let set = prefixIndex.get(prefix);
    if (!set) {
      set = new Set();
      prefixIndex.set(prefix, set);
    }
    set.add(key);
  }
}

function unregisterPrefix(key: string): void {
  const segments = key.split(':');
  for (let i = 1; i <= segments.length; i++) {
    const prefix = segments.slice(0, i).join(':');
    const set = prefixIndex.get(prefix);
    if (set) {
      set.delete(key);
      if (set.size === 0) {
        prefixIndex.delete(prefix);
      }
    }
  }
}

function evictLRU(): void {
  // Map preserves insertion order; oldest entries are at the front
  while (memoryCache.size > MAX_SIZE) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey === undefined) break;
    memoryCache.delete(oldestKey);
    unregisterPrefix(oldestKey);
  }
}

export const cache: CacheClient = {
  async getOrSet<T>(key: string, ttlSeconds: number, source: () => Promise<T>): Promise<T> {
    const existing = memoryCache.get(key);
    if (existing && !isExpired(existing)) {
      // Move to end for LRU (delete + re-set preserves freshness)
      memoryCache.delete(key);
      memoryCache.set(key, existing);
      return existing.data as T;
    }

    const fresh = await source();
    memoryCache.set(key, {
      data: fresh,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    registerPrefix(key);
    evictLRU();
    return fresh;
  },

  async del(keys: string | string[]): Promise<void> {
    const list = Array.isArray(keys) ? keys : [keys];
    for (const key of list) {
      memoryCache.delete(key);
      unregisterPrefix(key);
    }
  },

  async delByPattern(pattern: string): Promise<void> {
    // Optimisation: for patterns ending with *, use prefix index (O(1) lookup)
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1).replace(/:$/, '');
      const set = prefixIndex.get(prefix);
      if (set) {
        for (const key of set) {
          memoryCache.delete(key);
        }
        // Clean up all prefix entries for the deleted keys
        for (const key of set) {
          unregisterPrefix(key);
        }
        // Re-clean the matched prefix itself (unregisterPrefix may have partially removed it)
        prefixIndex.delete(prefix);
        return;
      }
      // Fall through to regex scan if prefix not in index (should be rare)
    }

    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of memoryCache.keys()) {
      if (regex.test(key)) {
        memoryCache.delete(key);
        unregisterPrefix(key);
      }
    }
  },
};
