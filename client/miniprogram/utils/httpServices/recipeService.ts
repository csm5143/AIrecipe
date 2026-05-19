/**
 * 菜谱数据服务层
 * 整合本地 JSON 缓存和 HTTP API
 * 替换原 wx.cloud.database() 的菜谱加载逻辑
 */

import * as recipeApi from '../httpApi/recipe';
import { Recipe } from '../../types/index';

function getFallbackRecipes(): Recipe[] {
  try {
    const data = require('../../data/recipes.js');
    return Array.isArray(data) ? data as Recipe[] : [];
  } catch {
    return [];
  }
}

// ============ API → App 数据格式转换 ============
// 后端 API 返回 { title, ingredients: {name}[] }，前端使用 { name, ingredients: string[] }
function transformApiRecipe(apiRecipe: recipeApi.Recipe): Recipe {
  let ingredients: string[] = [];
  if (apiRecipe.ingredients) {
    if (Array.isArray(apiRecipe.ingredients)) {
      ingredients = apiRecipe.ingredients.map((ing: any) =>
        typeof ing === 'string' ? ing : (ing.name || '')
      ).filter(Boolean);
    }
  }
  const difficulty = (() => {
    const d = apiRecipe.difficulty;
    if (d === 'easy' || d === 'normal' || d === 'hard') return d as 'easy' | 'normal' | 'hard';
    if (typeof d === 'number') {
      if (d <= 2) return 'easy';
      if (d <= 4) return 'normal';
      return 'hard';
    }
    return 'normal' as const;
  })();
  return {
    id: String(apiRecipe.id),
    name: apiRecipe.title || '',
    aliases: [],
    coverImage: apiRecipe.coverImage || '',
    description: apiRecipe.description || '',
    ingredients,
    mealTimes: apiRecipe.mealTimes || [],
    dishTypes: apiRecipe.dishTypes || [],
    timeCost: apiRecipe.cookingTime ?? null,
    difficulty,
  };
}

function transformApiRecipes(apiRecipes: recipeApi.Recipe[]): Recipe[] {
  return apiRecipes.map(transformApiRecipe);
}

// ============ 本地缓存 ============
const CACHE_KEY = 'local_recipes_cache';
const CACHE_META = 'local_recipes_meta';
const CACHE_EXPIRE_MS = 24 * 60 * 60 * 1000;

function getCached(): Recipe[] | null {
  try {
    const meta: any = wx.getStorageSync(CACHE_META);
    if (!meta) return null;
    if (Date.now() - meta.updateTime > CACHE_EXPIRE_MS) {
      wx.removeStorageSync(CACHE_KEY);
      wx.removeStorageSync(CACHE_META);
      return null;
    }
    const raw = wx.getStorageSync(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function setCached(recipes: Recipe[]): void {
  try {
    wx.setStorageSync(CACHE_KEY, JSON.stringify(recipes));
    wx.setStorageSync(CACHE_META, JSON.stringify({ updateTime: Date.now(), count: recipes.length }));
  } catch {}
}

// ============ 全局单例 ============
let _globalRecipes: Recipe[] | null = null;
let _globalPromise: Promise<Recipe[]> | null = null;
let _loaded = false;

/** 同步获取全局菜谱（优先缓存） */
export function getGlobalRecipes(): Recipe[] | null {
  if (_loaded && _globalRecipes !== null) return _globalRecipes;
  const cached = getCached();
  if (cached && cached.length > 0) {
    _globalRecipes = cached;
    _loaded = true;
    return cached;
  }
  _globalRecipes = getFallbackRecipes();
  _loaded = true;
  return _globalRecipes;
}

/** 异步获取全局菜谱 */
export function getGlobalRecipesAsync(): Promise<Recipe[]> {
  if (_globalPromise) return _globalPromise;
  if (_loaded && _globalRecipes !== null) return Promise.resolve(_globalRecipes);
  const cached = getCached();
  if (cached && cached.length > 0) {
    _globalRecipes = cached;
    _loaded = true;
    return Promise.resolve(cached);
  }
  _globalPromise = loadFromServer()
    .then(data => {
      if (data && data.length > 0) {
        _globalRecipes = data;
        setCached(data);
        _loaded = true;
        return data;
      }
      // API 失败或为空时，不锁死状态，下次调用可重试
      _globalRecipes = null;
      return [] as Recipe[];
    })
    .finally(() => { _globalPromise = null; });
  return _globalPromise;
}

async function loadFromServer(): Promise<Recipe[]> {
  const PAGE_SIZE = 100;
  let page = 1;
  let allRecipes: Recipe[] = [];

  try {
    while (true) {
      const res = await recipeApi.getRecipeList({ page, pageSize: PAGE_SIZE });
      if (!res.success || !res.data || res.data.length === 0) break;

      // 转换 API 数据格式后追加
      const transformed = transformApiRecipes(res.data);
      allRecipes = allRecipes.concat(transformed);

      // 后端返回了总数量，则不继续翻页
      if (res.total != null) {
        break;
      }
      // 否则按 pageSize 判断是否还有下一页
      if (res.data.length < PAGE_SIZE) break;
      page++;
    }
  } catch (e) {
    console.warn('[RecipeService] 从服务器加载菜谱失败', e);
  }

  // 若 API 没有数据，返回空数组，让调用方自行走 fallback
  return allRecipes;
}

/** 预加载（后台静默） */
export function preload(): void {
  if (_loaded || _globalPromise) return;
  getGlobalRecipesAsync().catch(() => {});
}

/** 按 ID 获取 */
export function getById(id: number | string): Recipe | null {
  const recipes = getGlobalRecipes();
  const idStr = String(id);
  return recipes ? (recipes.find(r => r.id === idStr) || null) : null;
}

/** 搜索菜谱（仅本地过滤，无 API 搜索端点） */
export async function search(keyword: string): Promise<Recipe[]> {
  const recipes = getGlobalRecipes() || [];
  const kw = keyword.toLowerCase();
  return recipes.filter(r =>
    (r.name || (r as any).title)?.toLowerCase().includes(kw) ||
    r.description?.toLowerCase().includes(kw)
  );
}

/** 推荐菜谱 */
export async function getFeatured(): Promise<Recipe[]> {
  const res = await recipeApi.getFeaturedRecipes({ pageSize: 20 });
  if (res.success && res.data) return transformApiRecipes(res.data);
  return (getGlobalRecipes() || []).filter(r => r.isFeatured).slice(0, 20);
}

/** 热门菜谱 */
export async function getHot(): Promise<Recipe[]> {
  const res = await recipeApi.getHotRecipes({ pageSize: 100 });
  if (res.success && res.data) return transformApiRecipes(res.data);
  return (getGlobalRecipes() || []).filter(r => r.isHot).slice(0, 100);
}

/** 清除缓存 */
export function clearCache(): void {
  wx.removeStorageSync(CACHE_KEY);
  wx.removeStorageSync(CACHE_META);
  _globalRecipes = null;
  _loaded = false;
  _globalPromise = null;
}
