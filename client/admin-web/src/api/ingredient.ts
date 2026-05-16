import request from './request';

export interface IngredientRow {
  id: number;
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
  isCommon?: boolean;
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
  isCommon?: boolean;
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

export interface IngredientListResponse {
  list: IngredientRow[];
  total: number;
}

export const ingredientApi = {
  list: (params: IngredientQuery) =>
    request.get<IngredientListResponse>('/ingredients', { params }),

  create: (data: IngredientFormData) =>
    request.post<{ id: number }>('/ingredients', data),

  update: (id: number, data: IngredientFormData) =>
    request.put<{ id: number }>(`/ingredients/${id}`, data),

  delete: (id: number) =>
    request.delete(`/ingredients/${id}`),

  batchImport: (items: any[], overwrite?: boolean) =>
    request.post<{ imported: number; updated: number; skipped: number }>('/ingredients/batch-import', { items, overwrite }),

  previewImport: (items: any[]) =>
    request.post<{ total: number; duplicateCount: number; duplicates: { name: string; existingId: number }[] }>('/ingredients/batch-import/preview', { items }),

  export: (params: IngredientQuery, format: 'csv' | 'xlsx') =>
    request.get('/ingredients/export', { params: { ...params, format }, responseType: 'blob' }),

  batchDelete: (ids: number[]) =>
    request.post<{ deleted: number }>('/ingredients/batch-delete', { ids }),
};
