/**
 * 本地 JSON 数据加载器
 * 微信小程序不支持 import JSON，使用 require() .js 同名模块代替
 * 原始 .json 文件保留，但代码使用 .js 版本
 */

// 使用 require() 加载 .js 模块（由 gen-js.js 从同名 .json 生成）
// 路径相对于 utils/ 目录，所以要回到 data/
const ingredientsData: any[] = require('../data/ingredients.js');
const hotRecipesData: any = require('../data/hotRecipes.js');
const recipesData: any = require('../data/recipes.js');

export interface IngredientItem {
  name: string;
  category: string;
  subCategory?: string;
}

/** 加载食材数据（来自本地 JSON） */
export function loadIngredientsJson(): IngredientItem[] {
  if (Array.isArray(ingredientsData)) {
    return ingredientsData as IngredientItem[];
  }
  return [];
}

/** 加载热门菜谱数据（来自本地 JSON）
 * hotRecipes.json 结构为 { lastUpdated, description, hotRecipes: [...] }
 * 所以 data 本身是对象，不是数组
 */
export function loadHotRecipesJson(): any {
  return hotRecipesData || {};
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

/** 加载菜谱数据（同步，来自本地 JSON） */
export function loadRecipesJson(): any[] {
  if (Array.isArray(recipesData)) {
    return recipesData;
  }
  if (recipesData && Array.isArray((recipesData as any).recipes)) {
    return (recipesData as any).recipes;
  }
  return [];
}

/** 加载菜谱数据（异步，Promise 包装） */
export function loadRecipesAsync(): Promise<any[]> {
  return Promise.resolve(loadRecipesJson());
}

// ============ 全局单例（与 cloudService 兼容）============

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
    if (cached) return; // 已有缓存，无需重复加载

    // 静默预加载本地 JSON
    const recipes = loadRecipesJson();
    if (recipes.length > 0) {
      wx.setStorageSync(CACHE_KEY, JSON.stringify(recipes));
      wx.setStorageSync(CACHE_META, JSON.stringify({ updateTime: Date.now(), count: recipes.length }));
    }
  } catch {}
}
