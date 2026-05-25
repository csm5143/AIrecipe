/**
 * cloudUserRecipe.ts — Compatibility wrapper
 * Re-exports the real HTTP API layer and adds missing types/constants/functions.
 * Used by user-recipe subpackage pages (upload/my-uploads/community/detail).
 */
import {
  submitRecipe as _submitRecipe,
  getMyRecipes as _getMyRecipes,
  getCommunityRecipes as _getCommunityRecipes,
  getUserRecipeDetail as _getRecipeDetail,
  deleteMyRecipe as _deleteMyRecipe,
  recordView as _recordView,
  type UserRecipe,
} from '../httpApi/userRecipe.js';
import { post, get } from '../httpApi/request.js';

// ============ Re-exports ============
export { UserRecipe };

export type RecipeStatus = 'pending' | 'approved' | 'rejected';
export type RecipeDifficulty = 'easy' | 'normal' | 'hard';

// ============ Type definitions ============
export interface Ingredient {
  name: string;
  amount: string;
  unit?: string;
  isOptional?: boolean;
}

export interface RecipeStep {
  description: string;
  image?: string;
  order?: number;
}

// ============ Constants ============
export const DIFFICULTY_OPTIONS = [
  { value: 'easy' as RecipeDifficulty, label: '简单' },
  { value: 'normal' as RecipeDifficulty, label: '中等' },
  { value: 'hard' as RecipeDifficulty, label: '困难' },
];

export const MEAL_TIME_OPTIONS = [
  { value: 'breakfast', label: '早餐' },
  { value: 'lunch', label: '午餐' },
  { value: 'dinner', label: '晚餐' },
  { value: 'late_night', label: '夜宵' },
];

export const DISH_TYPE_OPTIONS = [
  { value: 'staple', label: '主食' },
  { value: 'stir_fry', label: '小炒菜' },
  { value: 'soup', label: '汤品' },
  { value: 'cold', label: '凉菜' },
  { value: 'dessert', label: '甜品' },
  { value: 'drink', label: '饮品' },
  { value: 'diet', label: '减脂餐' },
  { value: 'children', label: '儿童餐' },
];

export const TAG_OPTIONS = [
  { value: '快手', label: '快手' },
  { value: '下饭', label: '下饭' },
  { value: '高蛋白', label: '高蛋白' },
  { value: '低卡', label: '低卡' },
  { value: '家常', label: '家常' },
  { value: '宴客', label: '宴客' },
  { value: '创意', label: '创意' },
  { value: '新手', label: '新手' },
];

export const STATUS_TEXT: Record<RecipeStatus, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
};

export const STATUS_COLOR: Record<RecipeStatus, string> = {
  pending: '#d4880e',
  approved: '#1f8a65',
  rejected: '#cf2d56',
};

// ============ API wrappers ============

export async function submitRecipe(params: {
  title: string;
  coverImage?: string;
  description?: string;
  difficulty?: RecipeDifficulty;
  cookingTime?: number;
  servings?: number;
  ingredients?: Ingredient[];
  steps?: RecipeStep[];
  tips?: string;
  tags?: string[];
  mealTimes?: string[];
  dishTypes?: string[];
}): Promise<{ success: boolean; message: string; recipeId?: number }> {
  return _submitRecipe(params);
}

export async function getMyRecipes(
  status?: RecipeStatus,
  page: number = 1,
  pageSize: number = 10,
): Promise<{ success: boolean; data?: UserRecipe[]; hasMore?: boolean; message?: string }> {
  return _getMyRecipes({ page, pageSize });
}

export async function getCommunityRecipes(params: {
  page?: number;
  pageSize?: number;
  keyword?: string;
}): Promise<{ success: boolean; data?: UserRecipe[]; hasMore?: boolean; message?: string }> {
  return _getCommunityRecipes(params);
}

export async function getRecipeDetail(id: string): Promise<{ success: boolean; data?: UserRecipe; message?: string }> {
  return _getRecipeDetail(Number(id));
}

export async function deleteMyRecipe(recipeId: number): Promise<{ success: boolean; message: string }> {
  return _deleteMyRecipe(recipeId);
}

export async function increaseViewCount(recipeId: string): Promise<void> {
  await _recordView(Number(recipeId));
}

/**
 * Toggle like on a user recipe.
 * POST /v1/user-recipes/:id/like
 */
export async function toggleLike(recipeId: string): Promise<{
  success: boolean;
  liked: boolean;
  likeCount: number;
  message: string;
}> {
  const res = await post<{ liked: boolean; likeCount: number }>(`/v1/user-recipes/${recipeId}/like`, {}, { withToken: true });
  return {
    success: res.success,
    liked: res.data?.liked || false,
    likeCount: res.data?.likeCount || 0,
    message: res.message || '',
  };
}

/**
 * Check if user has liked a recipe.
 */
export async function checkLiked(recipeId: string): Promise<boolean> {
  const res = await get<{ isLiked?: boolean }>(`/v1/user-recipes/${recipeId}`, {}, { withToken: true });
  const data = typeof res.data === 'object' && res.data !== null ? res.data : {};
  return !!(data as any).isLiked;
}
