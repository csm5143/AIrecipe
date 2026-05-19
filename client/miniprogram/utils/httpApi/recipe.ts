/**
 * 菜谱相关 API - 对接后端 /v1/app/recipes
 */

import { get, post } from './request';

// ============ 类型定义 ============

export interface Recipe {
  id: number;
  recipeKey: string;
  title: string;
  coverImage: string;
  description?: string;
  difficulty?: string;
  cookingTime?: number;
  servings?: number;
  ingredients?: any[];
  steps?: any[];
  tips?: string;
  tags?: string[];
  mealTimes?: string[];
  dishTypes?: string[];
  viewCount?: number;
  favoriteCount?: number;
  collectCount?: number;
  isHot?: boolean;
  isFeatured?: boolean;
  status?: string;
  authorName?: string;
  authorAvatar?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface RecipeQuery {
  page?: number;
  pageSize?: number;
  category?: string;
  cuisine?: string;
  keyword?: string;
  mealTime?: string;
  difficulty?: string;
  isHot?: boolean;
  isFeatured?: boolean;
  status?: string;
  order?: 'asc' | 'desc';
  sort?: string;
}

// ============ 公开菜谱 API（无需登录）============

/**
 * 获取推荐菜谱
 */
export async function getFeaturedRecipes(params: RecipeQuery = {}): Promise<{
  success: boolean; data?: Recipe[]; total?: number; hasMore?: boolean;
}> {
  const res = await get<Recipe[]>('/v1/app/recipes/featured', params);
  return { success: res.success, data: res.data, total: res.total, hasMore: res.hasMore };
}

/**
 * 获取热门菜谱
 */
export async function getHotRecipes(params: RecipeQuery = {}): Promise<{
  success: boolean; data?: Recipe[]; total?: number; hasMore?: boolean;
}> {
  const res = await get<Recipe[]>('/v1/app/recipes', { ...params, isHot: true });
  return { success: res.success, data: res.data, total: res.total, hasMore: res.hasMore };
}

/**
 * 获取菜谱列表
 */
export async function getRecipeList(params: RecipeQuery = {}): Promise<{
  success: boolean; data?: Recipe[]; total?: number; hasMore?: boolean;
}> {
  const res = await get<Recipe[]>('/v1/app/recipes', params);
  return { success: res.success, data: res.data, total: res.total, hasMore: res.hasMore };
}

/**
 * 获取菜谱详情
 */
export async function getRecipeDetail(id: number): Promise<{
  success: boolean; data?: Recipe;
}> {
  const res = await get<Recipe>(`/v1/app/recipes/${id}`);
  return { success: res.success, data: res.data };
}

// ============ 点赞 API（需登录）============

/**
 * 点赞/取消点赞（通过 user-recipes 端点）
 */
export async function toggleFavorite(recipeId: number): Promise<{
  success: boolean; liked?: boolean; count?: number; message?: string;
}> {
  const res = await post(`/v1/user-recipes/${recipeId}/like`, {});
  return {
    success: res.success,
    liked: (res.data as any)?.liked,
    count: (res.data as any)?.likeCount,
    message: res.message,
  };
}

/**
 * 获取点赞状态
 */
export async function checkFavoriteStatus(recipeId: number): Promise<boolean> {
  const res = await get<Recipe>(`/v1/user-recipes/${recipeId}`);
  return res.success && !!(res.data);
}

// ============ 补充缺失端点 ============

export interface RecipeCategory {
  name: string;
  count: number;
}

/**
 * 获取菜谱分类列表
 */
export async function getRecipeCategories(): Promise<{
  success: boolean; data?: RecipeCategory[];
}> {
  const res = await get<RecipeCategory[]>('/v1/app/recipes/categories');
  return { success: res.success, data: res.data };
}

/**
 * 按食材搜索菜谱
 */
export async function searchRecipesByIngredients(ingredients: string[]): Promise<{
  success: boolean; data?: Recipe[]; total?: number;
}> {
  const res = await get<Recipe[]>('/v1/app/recipes/by-ingredients', {
    ingredients: ingredients.join(','),
  });
  return { success: res.success, data: res.data, total: res.total };
}
