/**
 * 用户上传菜谱 API - 对接后端 /v1/user-recipes
 */

import { get, post, del } from './request';

// ============ 类型定义 ============

export type RecipeDifficulty = 'easy' | 'normal' | 'hard';
export type RecipeStatus = 'pending' | 'approved' | 'rejected';

export interface Ingredient {
  name: string;
  amount: string;
}

export interface RecipeStep {
  description: string;
  image?: string;
}

export interface UserRecipe {
  _id?: string;
  id: number;
  recipeId: string;
  title: string;
  coverImage: string;
  description: string;
  difficulty: RecipeDifficulty;
  cookingTime: number;
  servings: number;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  tips?: string;
  tags: string[];
  mealTimes: string[];
  dishTypes: string[];
  status: RecipeStatus;
  rejectReason?: string;
  viewCount: number;
  likeCount: number;
  createdAt: number;
  updatedAt: number;
  publishedAt?: number;
}

export interface SubmitRecipeParams {
  title: string;
  coverImage: string;
  description?: string;
  difficulty?: RecipeDifficulty;
  cookingTime?: number;
  servings?: number;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  tips?: string;
  tags?: string[];
  mealTimes?: string[];
  dishTypes?: string[];
}

// ============ API ============

/**
 * 提交菜谱
 */
export async function submitRecipe(params: SubmitRecipeParams): Promise<{
  success: boolean; message: string; recipeId?: string;
}> {
  const res = await post<{ recipeId: string }>('/v1/user-recipes', params);
  return {
    success: res.success,
    message: res.message || (res.success ? '提交成功' : '提交失败'),
    recipeId: res.data?.recipeId,
  };
}

/**
 * 获取我的上传列表
 */
export async function getMyRecipes(
  status?: RecipeStatus,
  page = 1,
  pageSize = 20
): Promise<{ success: boolean; data?: UserRecipe[]; total?: number; hasMore?: boolean }> {
  const params: any = { page, pageSize };
  if (status) params.status = status;
  const res = await get<UserRecipe[]>('/v1/user-recipes/my', params);
  return {
    success: res.success,
    data: res.data,
    total: res.total,
    hasMore: res.hasMore,
  };
}

/**
 * 获取社区菜谱列表
 */
export async function getCommunityRecipes(params: {
  page?: number;
  pageSize?: number;
  mealTime?: string;
} = {}): Promise<{ success: boolean; data?: UserRecipe[]; total?: number; hasMore?: boolean }> {
  const res = await get<UserRecipe[]>('/v1/user-recipes/community', {
    page: params.page || 1,
    pageSize: params.pageSize || 20,
    ...(params.mealTime ? { mealTime: params.mealTime } : {}),
  });
  return {
    success: res.success,
    data: res.data,
    total: res.total,
    hasMore: res.hasMore,
  };
}

/**
 * 获取菜谱详情
 */
export async function getRecipeDetail(recipeId: string): Promise<{
  success: boolean; data?: UserRecipe;
}> {
  // 后端用的是数字 ID，尝试解析
  const res = await get<UserRecipe>(`/v1/user-recipes/${recipeId}`);
  return { success: res.success, data: res.data };
}

/**
 * 删除我的菜谱
 */
export async function deleteMyRecipe(recipeId: string): Promise<{ success: boolean; message: string }> {
  const res = await del(`/v1/user-recipes/${recipeId}`);
  return { success: res.success, message: res.message || '' };
}

/**
 * 点赞/取消点赞
 */
export async function toggleLike(recipeId: string): Promise<{
  success: boolean; liked?: boolean; likeCount?: number; message?: string;
}> {
  const res = await post<{ liked: boolean; likeCount: number }>(`/v1/user-recipes/${recipeId}/like`, {});
  return {
    success: res.success,
    liked: res.data?.liked,
    likeCount: res.data?.likeCount,
    message: res.message,
  };
}

/**
 * 增加浏览量
 */
export async function increaseViewCount(recipeId: string): Promise<void> {
  await post(`/v1/user-recipes/${recipeId}/view`, {});
}
