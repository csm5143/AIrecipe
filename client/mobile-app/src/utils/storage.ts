/**
 * 存储工具封装
 */

interface StorageOptions {
  expire?: number; // 过期时间（毫秒）
}

/**
 * 设置存储（支持过期时间）
 */
export function setStorage<T = any>(key: string, value: T, options?: StorageOptions): void {
  const data: any = {
    value,
    timestamp: Date.now(),
  };

  if (options?.expire) {
    data.expire = Date.now() + options.expire;
  }

  try {
    uni.setStorageSync(key, JSON.stringify(data));
  } catch (e) {
    console.error('[Storage] setStorage failed:', e);
  }
}

/**
 * 获取存储
 */
export function getStorage<T = any>(key: string): T | null {
  try {
    const data = uni.getStorageSync(key);
    if (!data) return null;

    const parsed = JSON.parse(data);

    // 检查是否过期
    if (parsed.expire && Date.now() > parsed.expire) {
      uni.removeStorageSync(key);
      return null;
    }

    return parsed.value as T;
  } catch (e) {
    console.error('[Storage] getStorage failed:', e);
    return null;
  }
}

/**
 * 移除存储
 */
export function removeStorage(key: string): void {
  uni.removeStorageSync(key);
}

/**
 * 清空存储
 */
export function clearStorage(): void {
  uni.clearStorageSync();
}

/**
 * 检查存储是否存在
 */
export function hasStorage(key: string): boolean {
  return !!uni.getStorageSync(key);
}

// ==================== 常用存储快捷方法 ====================

// 缓存食谱列表
export function cacheRecipes(recipes: any[]): void {
  setStorage('cached_recipes', recipes, { expire: 30 * 60 * 1000 }); // 30分钟过期
}

export function getCachedRecipes(): any[] | null {
  return getStorage<any[]>('cached_recipes');
}

// 缓存搜索历史
export function addSearchHistory(keyword: string): void {
  const history = getSearchHistory();
  const filtered = history.filter((k) => k !== keyword);
  const newHistory = [keyword, ...filtered].slice(0, 20); // 最多保存20条
  setStorage('search_history', newHistory);
}

export function getSearchHistory(): string[] {
  return getStorage<string[]>('search_history') || [];
}

export function clearSearchHistory(): void {
  removeStorage('search_history');
}
