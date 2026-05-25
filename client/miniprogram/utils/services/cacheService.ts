/**
 * 统一缓存服务
 * 提供 Storage 读写 + TTL 过期机制
 * 优先读缓存 -> 过期则静默刷新 -> API 失败降级返回已过期缓存
 */

const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24h

interface CacheMeta {
  timestamp: number;
  ttl: number;
}

interface CacheEntry<T> {
  meta: CacheMeta;
  data: T;
}

/** 从 Storage 读取缓存 */
function getCache<T>(key: string): { meta: CacheMeta; data: T } | null {
  try {
    const raw = wx.getStorageSync(key);
    if (!raw) return null;
    const parsed: CacheEntry<T> = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!parsed.meta || !parsed.data) return null;
    return parsed as CacheEntry<T>;
  } catch {
    return null;
  }
}

/** 写入 Storage 缓存 */
function setCache<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
  const entry: CacheEntry<T> = {
    meta: { timestamp: Date.now(), ttl },
    data,
  };
  try {
    wx.setStorageSync(key, JSON.stringify(entry));
  } catch (e) {
    console.warn(`[CacheService] 写入缓存失败 key=${key}`, e);
  }
}

/** 缓存是否过期 */
function isExpired(meta: CacheMeta): boolean {
  return Date.now() - meta.timestamp > meta.ttl;
}

/** 并发请求去重：同一 key 的飞行中请求共享一个 Promise */
const inFlight = new Map<string, Promise<any>>();

/**
 * 获取数据，优先缓存，未过期直接返回，过期则静默刷新
 * @param key Storage key
 * @param ttl 过期时间 ms
 * @param source API 数据源函数
 * @returns 数据或 null
 */
export async function getOrFetch<T>(
  key: string,
  source: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T | null> {
  // 并发去重：如果同一个 key 已有进行中的请求，直接复用
  if (inFlight.has(key)) {
    return inFlight.get(key) as Promise<T | null>;
  }

  const cached = getCache<T>(key);

  if (cached && !isExpired(cached.meta)) {
    return cached.data;
  }

  // 已过期或无缓存，尝试刷新
  const promise = (async (): Promise<T | null> => {
    try {
      const fresh = await source();
      setCache(key, fresh, ttl);
      return fresh;
    } catch (e) {
      // API 失败，降级返回已过期缓存（如果有）
      if (cached) {
        console.warn(`[CacheService] API 失败，降级返回过期缓存 key=${key}`);
        return cached.data;
      }
      return null;
    }
  })();

  inFlight.set(key, promise);

  try {
    return await promise;
  } finally {
    inFlight.delete(key);
  }
}

/**
 * 同步获取缓存（不过期检查，用于即时 UI）
 */
export function getSync<T>(key: string): T | null {
  const cached = getCache<T>(key);
  return cached ? cached.data : null;
}

/**
 * 强制刷新缓存（忽略是否过期）
 */
export async function refresh<T>(
  key: string,
  source: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T | null> {
  try {
    const data = await source();
    setCache(key, data, ttl);
    return data;
  } catch (e) {
    console.warn(`[CacheService] 强制刷新失败 key=${key}`, e);
    return null;
  }
}

/**
 * 写入缓存
 */
export function set<T>(key: string, data: T, ttl?: number): void {
  setCache(key, data, ttl);
}

/**
 * 删除缓存
 */
export function remove(key: string): void {
  try {
    wx.removeStorageSync(key);
  } catch {}
}

/**
 * 清除所有以 prefix 开头的缓存
 */
export function clearPrefix(prefix: string): void {
  try {
    const info = wx.getStorageInfoSync();
    for (const key of info.keys) {
      if (key.startsWith(prefix)) {
        wx.removeStorageSync(key);
      }
    }
  } catch {}
}

/** 统一缓存服务对象（用于模块化导入） */
export const cacheService = {
  getOrFetch,
  getSync,
  refresh,
  set,
  remove,
  clearPrefix,
};
