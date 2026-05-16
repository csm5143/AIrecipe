/**
 * 菜谱缓存管理工具
 * 实现懒加载 + 本地缓存，避免一次性加载整个 recipes.json
 */

import { Recipe } from '../types/index';

const CACHE_KEY_PREFIX = 'recipe_cache_';
const FULL_LIST_CACHE_KEY = 'recipe_full_list';
const CACHE_EXPIRE_DAYS = 7; // 缓存7天过期
/** 与 Recipe 字段一致后递增，避免旧缓存缺 steps/usage */
const CACHE_SCHEMA_VERSION = 3;

interface CacheMeta {
  updateTime: number;
  version: number;
}

/**
 * 获取缓存元信息
 */
function getCacheMeta(key: string): CacheMeta | null {
  try {
    const meta = wx.getStorageSync(`${key}_meta`);
    return meta ? JSON.parse(meta) : null;
  } catch (e) {
    return null;
  }
}

/**
 * 设置缓存元信息
 */
function setCacheMeta(key: string, meta: CacheMeta): void {
  try {
    wx.setStorageSync(`${key}_meta`, JSON.stringify(meta));
  } catch (e) {
    console.warn('设置缓存元信息失败', e);
  }
}

/**
 * 检查缓存是否过期
 */
function isCacheExpired(meta: CacheMeta | null): boolean {
  if (!meta) return true;
  const now = Date.now();
  const expireMs = CACHE_EXPIRE_DAYS * 24 * 60 * 60 * 1000;
  return now - meta.updateTime > expireMs;
}

function isCacheStale(meta: CacheMeta | null): boolean {
  if (!meta) return true;
  if (meta.version !== CACHE_SCHEMA_VERSION) return true;
  return isCacheExpired(meta);
}

/**
 * 保存单条菜谱到缓存
 */
export function cacheRecipe(recipe: Recipe): void {
  if (!recipe || !recipe.id) return;
  const key = `${CACHE_KEY_PREFIX}${recipe.id}`;
  try {
    wx.setStorageSync(key, JSON.stringify(recipe));
    setCacheMeta(key, { updateTime: Date.now(), version: CACHE_SCHEMA_VERSION });
  } catch (e) {
    console.warn('缓存菜谱失败', e);
  }
}

/**
 * 从缓存获取单条菜谱
 */
export function getCachedRecipe(id: string): Recipe | null {
  const key = `${CACHE_KEY_PREFIX}${id}`;
  const meta = getCacheMeta(key);

  if (isCacheStale(meta)) {
    try {
      wx.removeStorageSync(key);
      wx.removeStorageSync(`${key}_meta`);
    } catch (e) {}
    return null;
  }

  try {
    const data = wx.getStorageSync(key);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn('读取缓存菜谱失败', e);
  }
  return null;
}

/**
 * 批量缓存菜谱
 */
export function cacheRecipes(recipes: Recipe[]): void {
  for (const recipe of recipes) {
    cacheRecipe(recipe);
  }
}

/**
 * 保存菜谱列表ID（用于快速查找）
 */
export function cacheRecipeIdList(ids: string[]): void {
  try {
    wx.setStorageSync(FULL_LIST_CACHE_KEY, JSON.stringify(ids));
    setCacheMeta(FULL_LIST_CACHE_KEY, { updateTime: Date.now(), version: CACHE_SCHEMA_VERSION });
  } catch (e) {
    console.warn('缓存菜谱ID列表失败', e);
  }
}

/**
 * 获取所有缓存的菜谱ID列表
 */
export function getCachedRecipeIdList(): string[] | null {
  const meta = getCacheMeta(FULL_LIST_CACHE_KEY);
  if (isCacheStale(meta)) {
    try {
      wx.removeStorageSync(FULL_LIST_CACHE_KEY);
      wx.removeStorageSync(`${FULL_LIST_CACHE_KEY}_meta`);
    } catch (e) {}
    return null;
  }

  try {
    const data = wx.getStorageSync(FULL_LIST_CACHE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

/**
 * 预缓存指定分类的菜谱（后台静默执行）
 */
export function preCacheRecipes(recipes: Recipe[]): void {
  // 异步预缓存，不阻塞主流程
  setTimeout(() => {
    cacheRecipes(recipes);
  }, 0);
}

