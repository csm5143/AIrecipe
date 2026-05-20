/**
 * 用户投稿菜谱 API - 对接后端 /v1/user-recipes
 */
import { get, post, del } from './request.js';
import { Recipe } from './recipe.js';

// ============ 类型定义 ============

export interface UserRecipe {
  id: number;
  title: string;
  coverImage?: string;
  description?: string;
  difficulty?: string;
  cookingTime?: number;
  ingredients?: any[];
  steps?: any[];
  tips?: string;
  status: string;
  viewCount?: number;
  favoriteCount?: number;
  authorName?: string;
  authorAvatar?: string;
  createdAt: string;
  updatedAt: string;
}

// ============ API ============

/**
 * 提交用户菜谱（待审核）
 */
export async function submitRecipe(params: {
  title: string;
  coverImage?: string;
  description?: string;
  difficulty?: string;
  cookingTime?: number;
  ingredients?: any[];
  steps?: any[];
  tips?: string;
  cuisine?: string;
  category?: string;
}): Promise<{ success: boolean; message: string; recipeId?: number }> {
  const res = await post<{ id: number }>('/v1/user-recipes', params, { withToken: true });
  return {
    success: res.success,
    message: res.message || '',
    recipeId: res.data?.id,
  };
}

/**
 * 获取我投稿的菜谱
 */
export async function getMyRecipes(params: {
  page?: number;
  pageSize?: number;
} = {}): Promise<{
  success: boolean; data?: UserRecipe[]; total?: number; hasMore?: boolean;
}> {
  const res = await get<UserRecipe[]>('/v1/user-recipes/my', params, { withToken: true });
  return { success: res.success, data: res.data, total: res.total, hasMore: res.hasMore };
}

/**
 * 获取社区菜谱列表
 */
export async function getCommunityRecipes(params: {
  page?: number;
  pageSize?: number;
  keyword?: string;
} = {}): Promise<{
  success: boolean; data?: UserRecipe[]; total?: number; hasMore?: boolean;
}> {
  const res = await get<UserRecipe[]>('/v1/user-recipes/community', params);
  return { success: res.success, data: res.data, total: res.total, hasMore: res.hasMore };
}

/**
 * 获取用户菜谱详情
 */
export async function getUserRecipeDetail(id: number): Promise<{
  success: boolean; data?: UserRecipe;
}> {
  const res = await get<UserRecipe>(`/v1/user-recipes/${id}`);
  return { success: res.success, data: res.data };
}

/**
 * 删除我投稿的菜谱
 */
export async function deleteMyRecipe(id: number): Promise<{ success: boolean; message: string }> {
  const res = await del(`/v1/user-recipes/${id}`, {}, { withToken: true });
  return { success: res.success, message: res.message || '' };
}

/**
 * 记录菜谱浏览
 */
export async function recordView(id: number): Promise<{ success: boolean }> {
  const res = await post(`/v1/user-recipes/${id}/view`, {}, { withToken: true });
  return { success: res.success };
}
