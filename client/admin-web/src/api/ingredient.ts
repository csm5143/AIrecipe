import request from './request';
import type { ApiResponse, PaginatedResponse } from '@airecipe/shared-types';

export interface IngredientRow {
  id: number;
  name: string;
  alias?: string;
  category: string;
  subCategory?: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  sodium: number;
  status: string;
  remark?: string;
}

export interface IngredientFormData {
  id?: number;
  name: string;
  alias?: string;
  category: string;
  subCategory?: string;
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  fiber?: number;
  sodium?: number;
  status?: string;
  remark?: string;
}

export interface IngredientQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  category?: string;
  status?: string;
}

export interface PaginatedIngredientData {
  page: number;
  pageSize: number;
  total: number;
  list: IngredientRow[];
}

export const ingredientApi = {
  list: (params: IngredientQuery) =>
    request.get<PaginatedResponse<PaginatedIngredientData>>('/ingredients', { params }),

  create: (data: IngredientFormData) =>
    request.post<ApiResponse<{ id: number }>>('/ingredients', data),

  update: (id: number, data: IngredientFormData) =>
    request.put<ApiResponse<{ id: number }>>(`/ingredients/${id}`, data),

  delete: (id: number) =>
    request.delete<ApiResponse<null>>(`/ingredients/${id}`),

  batchImport: (data: IngredientFormData[]) =>
    request.post<ApiResponse<{ imported: number; skipped: number }>>('/ingredients/batch-import', data),

  export: () =>
    request.get<PaginatedResponse<IngredientRow[]>>('/ingredients', { params: { pageSize: 99999 } }),
};
