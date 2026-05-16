/**
 * 菜谱相关 API - 对接后端 /v1/recipes
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
  const res = await get<Recipe[]>('/v1/recipes/featured', params);
  return { success: res.success, data: res.data, total: res.total, hasMore: res.hasMore };
}

/**
 * 获取菜谱列表
 */
export async function getRecipeList(params: RecipeQuery = {}): Promise<{
  success: boolean; data?: Recipe[]; total?: number; hasMore?: boolean;
}> {
  const res = await get<Recipe[]>('/v1/recipes', params);
  return { success: res.success, data: res.data, total: res.total, hasMore: res.hasMore };
}

/**
 * 获取菜谱详情
 */
export async function getRecipeDetail(id: number): Promise<{
  success: boolean; data?: Recipe;
}> {
  const res = await get<Recipe>(`/v1/recipes/${id}`);
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
  // 后端 /v1/user-recipes/:id 本身返回完整菜谱数据，暂无独立状态查询端点
  const res = await get<Recipe>(`/v1/user-recipes/${recipeId}`);
  return res.success && !!(res.data);
}
