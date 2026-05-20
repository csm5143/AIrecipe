/**
 * 菜谱数据服务层
 * 整合本地 JSON 缓存和 HTTP API
 * 替换原 wx.cloud.database() 的菜谱加载逻辑
 */

import * as recipeApi from '../httpApi/recipe.js';
import { Recipe } from '../../types/index.js';

// ============ API → App 数据格式转换 ============
// 后端 mapRecipeToAppFormat 返回 { name, timeCost, ingredients: string[], ... }
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
  const api = apiRecipe as any;
  return {
    id: String(apiRecipe.id),
    name: api.name || api.title || '',
    aliases: api.aliases || [],
    coverImage: apiRecipe.coverImage || '',
    description: apiRecipe.description || '',
    ingredients,
    mealTimes: apiRecipe.mealTimes || [],
    dishTypes: apiRecipe.dishTypes || [],
    timeCost: api.timeCost ?? api.cookingTime ?? null,
    difficulty,
    isHot: apiRecipe.isHot ?? false,
    isNew: api.isNew ?? false,
    steps: api.steps || [],
    usage: api.usage || {},
    nutrition: api.nutrition || null,
    fitnessMeal: api.fitnessMeal ?? false,
    fitnessCategory: api.fitnessCategory || '',
    goal: api.goal || '',
    childrenMeal: api.childrenMeal ?? false,
    ageBand: api.ageBand || '',
  };
}

function transformApiRecipes(apiRecipes: recipeApi.Recipe[]): Recipe[] {
  return apiRecipes.map(transformApiRecipe);
}

// ============ 本地缓存 ============
const CACHE_KEY = 'local_recipes_cache_v2';
const CACHE_META = 'local_recipes_meta_v2';
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
  _globalRecipes = [];
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

  try {
    // 第一页：获取数据 + total
    const firstRes = await recipeApi.getRecipeList({ page: 1, pageSize: PAGE_SIZE });
    if (!firstRes.success || !firstRes.data || firstRes.data.length === 0) return [];

    const firstPage = transformApiRecipes(firstRes.data);
    const total = firstRes.total ?? 0;
    if (total === 0 || firstRes.data.length < PAGE_SIZE) return firstPage;

    // 计算剩余页数，并行请求
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const remainingPages: Promise<Recipe[]>[] = [];
    for (let page = 2; page <= totalPages; page++) {
      remainingPages.push(
        recipeApi.getRecipeList({ page, pageSize: PAGE_SIZE })
          .then(res => res.success && res.data ? transformApiRecipes(res.data) : [])
          .catch(() => [] as Recipe[])
      );
    }

    const results = await Promise.all(remainingPages);
    return firstPage.concat(...results);
  } catch (e) {
    console.warn('[RecipeService] 从服务器加载菜谱失败', e);
    return [];
  }
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
