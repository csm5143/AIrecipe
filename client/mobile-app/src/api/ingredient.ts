/**
 * 食材相关 API
 */
import { get } from './request';
import type { Ingredient } from '@/types';

// 获取食材分类
export function getIngredientCategories() {
  return get<ApiResponse<{ id: string; name: string; icon: string }[]>>('/ingredients/categories');
}

// 获取食材列表
export function getIngredients(params?: {
  category?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}) {
  return get<ApiResponse<Ingredient[]>>('/ingredients', { params });
}

// 获取常用食材
export function getCommonIngredients() {
  return get<ApiResponse<Ingredient[]>>('/ingredients/common');
}

// 获取食材详情
export function getIngredientDetail(id: number) {
  return get<ApiResponse<Ingredient>>(`/ingredients/${id}`);
}

// 搜索食材
export function searchIngredients(keyword: string) {
  return get<ApiResponse<Ingredient[]>>('/ingredients/search', {
    params: { keyword },
  });
}
