/**
 * 食材 API - 对接后端 /v1/app/ingredients
 */

import { get } from './request.js';

export interface Ingredient {
  id: number;
  name: string;
  alias?: string;
  subCategory?: string;
  category: string;
  unit?: string;
  status: string;
}

const INGREDIENT_PAGE_SIZE = 100;

/**
 * 获取小程序端食材列表（自动分页，直到获取全部数据）
 * 后端 GET /v1/app/ingredients 返回 { code: 200, data: { list, total, page, pageSize } }
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
  // keyword 搜索只取第一页
  if (params.keyword) {
    const res = await get<Ingredient[]>('/v1/app/ingredients', {
      page: 1,
      pageSize: params.pageSize || INGREDIENT_PAGE_SIZE,
      keyword: params.keyword,
      category: params.category || undefined,
    });
    if (res.success && res.data && Array.isArray(res.data)) {
      return { success: true, data: res.data, total: res.data.length };
    }
    return { success: false };
  }

  // 无 keyword 时，分页获取全部食材
  const allItems: Ingredient[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const res = await get<Ingredient[]>('/v1/app/ingredients', {
      page,
      pageSize: INGREDIENT_PAGE_SIZE,
      category: params.category || undefined,
    });

    if (!res.success || !res.data || !Array.isArray(res.data) || res.data.length === 0) {
      hasMore = false;
      break;
    }

    allItems.push(...res.data);

    // 根据返回的 hasMore / total 判断是否还有下一页
    const returned = res.data.length;
    const total = res.total;
    if (total !== undefined) {
      hasMore = allItems.length < total;
    } else {
      hasMore = returned === INGREDIENT_PAGE_SIZE;
    }
    page++;
  }

  return { success: true, data: allItems, total: allItems.length };
}
