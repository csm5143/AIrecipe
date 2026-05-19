/**
 * 食材 API - 对接后端 /v1/app/ingredients
 */

import { get } from './request';

export interface Ingredient {
  id: number;
  name: string;
  alias?: string;
  subCategory?: string;
  category: string;
  unit?: string;
  status: string;
}

/**
 * 获取小程序端食材列表
 * 后端 GET /v1/app/ingredients 返回 { code: 200, data: [...] }
 * request.ts 解析为 { success: true, data: [...] }
 */
export async function getAppIngredientsList(params: {
  pageSize?: number;
  keyword?: string;
  category?: string;
} = {}): Promise<{
  success: boolean;
  data?: Ingredient[];
  total?: number;
}> {
  const res = await get<Ingredient[]>('/v1/app/ingredients', {
    pageSize: params.pageSize || 1000,
    keyword: params.keyword || undefined,
    category: params.category || undefined,
  });
  if (res.success && res.data && Array.isArray(res.data)) {
    return { success: true, data: res.data, total: res.data.length };
  }
  return { success: false };
}
