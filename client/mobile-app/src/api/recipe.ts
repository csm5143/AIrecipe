/**
 * 食谱相关 API
 */
import { get, post, del } from './request';
import type { Recipe, PaginatedQuery } from '@/types';

// 获取食谱列表
export function getRecipes(params?: PaginatedQuery & {
  category?: string;
  difficulty?: string;
  keyword?: string;
}) {
  return get<ApiResponse<Recipe[]>>('/recipes', { params });
}

// 获取食谱详情
export function getRecipeDetail(id: number) {
  return get<ApiResponse<Recipe>>(`/recipes/${id}`);
}

// 获取推荐食谱
export function getRecommendedRecipes(limit = 10) {
  return get<ApiResponse<Recipe[]>>('/recipes/recommended', { params: { limit } });
}

// 获取热门食谱
export function getHotRecipes(limit = 10) {
  return get<ApiResponse<Recipe[]>>('/recipes/hot', { params: { limit } });
}

// 获取最新食谱
export function getLatestRecipes(limit = 10) {
  return get<ApiResponse<Recipe[]>>('/recipes/latest', { params: { limit } });
}

// 搜索食谱
export function searchRecipes(keyword: string, params?: PaginatedQuery) {
  return get<ApiResponse<Recipe[]>>('/recipes/search', {
    params: { keyword, ...params },
  });
}

// 获取食谱分类
export function getRecipeCategories() {
  return get<ApiResponse<{ id: string; name: string; icon: string }[]>>('/recipes/categories');
}

// 收藏食谱
export function collectRecipe(recipeId: number) {
  return post<ApiResponse<null>>('/recipes/collect', { data: { recipeId } });
}

// 取消收藏
export function uncollectRecipe(recipeId: number) {
  return del<ApiResponse<null>>(`/recipes/collect/${recipeId}`);
}

// 获取用户收藏列表
export function getCollectedRecipes(params?: PaginatedQuery) {
  return get<ApiResponse<Recipe[]>>('/recipes/collected', { params });
}

// AI 拍照识别食材生成食谱
export function generateRecipeByPhoto(imageUrl: string, preferences?: {
  diet?: string;
  cookingTime?: number;
  servings?: number;
}) {
  return post<ApiResponse<Recipe>>('/ai/generate-by-photo', {
    data: { imageUrl, ...preferences },
  });
}

// AI 根据食材生成食谱
export function generateRecipeByIngredients(ingredients: string[], preferences?: {
  diet?: string;
  cookingTime?: number;
  servings?: number;
}) {
  return post<ApiResponse<Recipe>>('/ai/generate-by-ingredients', {
    data: { ingredients, ...preferences },
  });
}

// 记录食谱浏览
export function recordRecipeView(recipeId: number) {
  return post<ApiResponse<null>>(`/recipes/${recipeId}/view`);
}

// 分享食谱
export function shareRecipe(recipeId: number) {
  return post<ApiResponse<{ shareUrl: string }>>(`/recipes/${recipeId}/share`);
}
