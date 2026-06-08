import request from '../utils/request';
import type { Recipe } from '@airecipe/shared-types';

export interface RecipeListQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  category?: string;
  status?: string;
  dishType?: string;
  mealTime?: string;
  source?: string;
  difficulty?: string;
  fitnessMeal?: boolean;
  childrenMeal?: boolean;
  isFeatured?: boolean;
  isHot?: boolean;
  sort?: string;
  order?: 'asc' | 'desc';
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
  isFeatured?: boolean;
  isHot?: boolean;
}

export interface RecipeListResponse {
  list: Recipe[];
  total: number;
}

export const recipeApi = {
  list: (params: RecipeListQuery) =>
    request.get<RecipeListResponse>('/recipes', { params }),

  detail: (id: number) =>
    request.get<Recipe>(`/recipes/${id}`),

  create: (data: CreateRecipeDto) =>
    request.post<Recipe>('/recipes', data),

  update: (id: number, data: CreateRecipeDto) =>
    request.put<Recipe>(`/recipes/${id}`, data),

  delete: (id: number) =>
    request.delete(`/recipes/${id}`),

  publish: (id: number) =>
    request.post(`/recipes/${id}/publish`),

  offline: (id: number) =>
    request.post(`/recipes/${id}/offline`),

  batchDelete: (ids: number[]) =>
    request.post('/recipes/batch-delete', { ids }),

  batchUpdate: (ids: number[], data: { isFeatured?: boolean; isHot?: boolean }) =>
    request.patch('/recipes/batch', { ids, data }),

  import: (data: any[]) =>
    request.post('/recipes/import', { recipes: data }),

  export: (params: RecipeListQuery, format: 'csv' | 'xlsx') =>
    request.get('/recipes/export', { params: { ...params, format }, responseType: 'blob' }),
};
