/**
 * 本地 JSON 数据加载器（安全版）
 *
 * 所有 require 调用都包裹在 try-catch 中，
 * 文件不存在时返回空数组而非崩溃。
 *
 * 注意：所有函数均同步，不依赖网络。
 * 调用方应优先使用 API 接口，此模块仅作兜底。
 */

// 尝试加载本地 JSON 文件，不存在时返回空
function safeRequireJson(path: string): any {
  try {
    const data = require(path);
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.recipes)) return data.recipes;
    if (data && Array.isArray(data.hotRecipes)) return data.hotRecipes;
    return data;
  } catch (e) {
    return [];
  }
}

// 食材数据（来自本地 ingredients.js，不存在则为空）
let _ingredients: any[] = [];
try {
  const raw = require('../data/ingredients.js');
  _ingredients = Array.isArray(raw) ? raw : [];
} catch (e) {
  _ingredients = [];
}

// 热榜数据
let _hotRecipes: any = {};
try {
  const raw = require('../data/hotRecipes.js');
  _hotRecipes = raw || {};
} catch (e) {
  _hotRecipes = {};
}

// 菜谱数据
let _recipes: any[] = [];
try {
  const raw = require('../data/recipes.js');
  _recipes = Array.isArray(raw)
    ? raw
    : (raw && Array.isArray(raw.recipes))
    ? raw.recipes
    : [];
} catch (e) {
  _recipes = [];
}

export interface IngredientItem {
  name: string;
  category: string;
  subCategory?: string;
}

/** 加载食材数据（来自本地 JSON，不存在则为空数组） */
export function loadIngredientsJson(): IngredientItem[] {
  return _ingredients as IngredientItem[];
}

/** 加载热榜数据（来自本地 JSON，不存在则为空对象） */
export function loadHotRecipesJson(): any {
  return _hotRecipes;
}

/** 加载菜谱数据（同步，来自本地 JSON，不存在则为空数组） */
export function loadRecipesJson(): any[] {
  return _recipes;
}

/** 加载食材数据（异步，Promise 包装） */
export function loadIngredientsAsync(): Promise<any[]> {
  return Promise.resolve(_ingredients);
}

/** 加载菜谱数据（异步，Promise 包装） */
export function loadRecipesAsync(): Promise<any[]> {
  return Promise.resolve(_recipes);
}

/** 按分类获取食材列表 */
export function getIngredientsByCategory(): Record<string, IngredientItem[]> {
  const items = loadIngredientsJson();
  const groups: Record<string, IngredientItem[]> = {};
  for (const item of items) {
    const cat = item.category || '其他';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  }
  return groups;
}

/** 搜索食材 */
export function searchIngredients(keyword: string): IngredientItem[] {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return [];
  return loadIngredientsJson().filter(i =>
    i.name.toLowerCase().includes(kw) ||
    (i.category && i.category.toLowerCase().includes(kw))
  );
}

// ============ 全局单例缓存（与 cloudService 兼容）============

const CACHE_KEY = 'local_recipes_cache';
const CACHE_META = 'local_recipes_meta';
const CACHE_EXPIRE_MS = 24 * 60 * 60 * 1000;

interface CacheMeta {
  updateTime: number;
  count: number;
}

function getCacheMeta(): CacheMeta | null {
  try {
    const raw = wx.getStorageSync(CACHE_META);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function isCacheExpired(meta: CacheMeta | null): boolean {
  if (!meta) return true;
  return Date.now() - meta.updateTime > CACHE_EXPIRE_MS;
}

/** 获取全局菜谱（同步，优先缓存） */
export function getGlobalRecipes(): any[] {
  try {
    const meta = getCacheMeta();
    if (isCacheExpired(meta)) {
      wx.removeStorageSync(CACHE_KEY);
      wx.removeStorageSync(CACHE_META);
      return loadRecipesJson();
    }
    const raw = wx.getStorageSync(CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return loadRecipesJson();
}

/** 预加载（后台静默，兼容 cloudService 接口） */
export function preloadGlobalRecipes(_fallback: () => any[]): void {
  try {
    const cached = wx.getStorageSync(CACHE_KEY);
    if (cached) return;
    const recipes = loadRecipesJson();
    if (recipes.length > 0) {
      wx.setStorageSync(CACHE_KEY, JSON.stringify(recipes));
      wx.setStorageSync(CACHE_META, JSON.stringify({ updateTime: Date.now(), count: recipes.length }));
    }
  } catch {}
}
