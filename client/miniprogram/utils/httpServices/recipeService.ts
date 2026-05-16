/**
 * 菜谱数据服务层
 * 整合本地 JSON 缓存和 HTTP API
 * 替换原 wx.cloud.database() 的菜谱加载逻辑
 */

import * as recipeApi from '../httpApi/recipe';
import { Recipe } from '../../types/index';
const fallbackRecipes: any[] = require('../../data/recipes.js');

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
  _globalRecipes = fallbackRecipes as Recipe[];
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
      _globalRecipes = fallbackRecipes as Recipe[];
      _loaded = true;
      return _globalRecipes;
    })
    .finally(() => { _globalPromise = null; });
  return _globalPromise;
}

async function loadFromServer(): Promise<Recipe[]> {
  try {
    const res = await recipeApi.getRecipeList({ pageSize: 100 });
    if (res.success && res.data && res.data.length > 0) return res.data;
  } catch (e) {
    console.warn('[RecipeService] 从服务器加载菜谱失败', e);
  }
  return [];
}

/** 预加载（后台静默） */
export function preload(): void {
  if (_loaded || _globalPromise) return;
  getGlobalRecipesAsync().catch(() => {});
}

/** 按 ID 获取 */
export function getById(id: number): Recipe | null {
  const recipes = getGlobalRecipes();
  return recipes ? (recipes.find(r => r.id === id) || null) : null;
}

/** 搜索菜谱 */
export async function search(keyword: string): Promise<Recipe[]> {
  const res = await recipeApi.searchRecipes(keyword);
  if (res.success && res.data) return res.data;
  const recipes = getGlobalRecipes() || [];
  const kw = keyword.toLowerCase();
  return recipes.filter(r =>
    r.title?.toLowerCase().includes(kw) ||
    r.description?.toLowerCase().includes(kw)
  );
}

/** 推荐菜谱 */
export async function getFeatured(): Promise<Recipe[]> {
  const res = await recipeApi.getFeaturedRecipes({ pageSize: 20 });
  if (res.success && res.data) return res.data;
  return (getGlobalRecipes() || []).filter(r => r.isFeatured).slice(0, 20);
}

/** 热门菜谱 */
export async function getHot(): Promise<Recipe[]> {
  const res = await recipeApi.getHotRecipes({ pageSize: 20 });
  if (res.success && res.data) return res.data;
  return (getGlobalRecipes() || []).filter(r => r.isHot).slice(0, 20);
}

/** 清除缓存 */
export function clearCache(): void {
  wx.removeStorageSync(CACHE_KEY);
  wx.removeStorageSync(CACHE_META);
  _globalRecipes = null;
  _loaded = false;
  _globalPromise = null;
}
