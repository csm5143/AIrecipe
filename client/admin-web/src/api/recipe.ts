import request from '../utils/request';
import type { ApiResponse, Recipe, PaginatedQuery } from '@airecipe/shared-types';

export interface RecipeListQuery extends PaginatedQuery {
  keyword?: string;
  category?: string;
  status?: string;
  dishType?: string;
  difficulty?: string;
  fitnessMeal?: boolean;
  childrenMeal?: boolean;
}

export interface CreateRecipeDto {
  title: string;
  description?: string;
  coverImage?: string;
  difficulty: string;
  cookingTime?: number;
  cuisine?: string;
  category?: string;
  ingredients: { name: string; amount: string; unit?: string; isOptional?: boolean }[];
  steps: { order: number; content: string; image?: string; duration?: number }[];
  tags?: string[];
  status: string;
  nutrition?: { calories?: number; protein?: number; fat?: number; carbs?: number; fiber?: number; sodium?: number };
  tips?: string;
  servings?: number;
  mealTimes?: string[];
  dishTypes?: string[];
  fitnessMeal?: boolean;
  fitnessCategory?: string;
  goal?: string;
  ageBand?: string;
  childrenMeal?: boolean;
}

export const recipeApi = {
  list: (params: RecipeListQuery) =>
    request.get<ApiResponse<{ list: Recipe[]; total: number }>>('/recipes', { params }),

  detail: (id: number) =>
    request.get<ApiResponse<Recipe>>(`/recipes/${id}`),

  create: (data: CreateRecipeDto) =>
    request.post<ApiResponse<Recipe>>('/recipes', data),

  update: (id: number, data: CreateRecipeDto) =>
    request.put<ApiResponse<Recipe>>(`/recipes/${id}`, data),

  delete: (id: number) =>
    request.delete<ApiResponse>(`/recipes/${id}`),

  publish: (id: number) =>
    request.post<ApiResponse>(`/recipes/${id}/publish`),

  offline: (id: number) =>
    request.post<ApiResponse>(`/recipes/${id}/offline`),

  batchDelete: (ids: number[]) =>
    request.post<ApiResponse>('/recipes/batch-delete', { ids }),

  import: (data: any[]) =>
    request.post<ApiResponse>('/recipes/import', { recipes: data }),
};
