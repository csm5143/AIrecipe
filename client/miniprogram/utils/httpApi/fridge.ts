/**
 * 冰箱 API - 对接后端 /v1/app/fridge
 */

import { get, post, put, del } from './request';

export interface FridgeItem {
  id: string;
  name: string;
  amount: string;
  unit: string;
  category: string;
  addedAt: number;
}

/**
 * 获取冰箱食材列表
 */
export async function getFridgeItems(): Promise<{
  success: boolean; data?: FridgeItem[]; message?: string;
}> {
  const res = await get<FridgeItem[]>('/v1/app/fridge', {}, { withToken: true });
  return { success: res.success, data: res.data, message: res.message };
}

/**
 * 添加食材到冰箱
 */
export async function addFridgeItem(params: {
  name: string;
  amount?: string;
  unit?: string;
  category?: string;
}): Promise<{ success: boolean; data?: FridgeItem; message?: string }> {
  const res = await post<FridgeItem>('/v1/app/fridge', params, { withToken: true });
  return { success: res.success, data: res.data, message: res.message };
}

/**
 * 批量添加食材
 */
export async function addFridgeItemsBatch(items: Array<{
  name: string;
  amount?: string;
  unit?: string;
  category?: string;
}>): Promise<{ success: boolean; data?: FridgeItem[]; message?: string }> {
  const res = await post<FridgeItem[]>('/v1/app/fridge/batch', { items }, { withToken: true });
  return { success: res.success, data: res.data, message: res.message };
}

/**
 * 更新冰箱食材
 */
export async function updateFridgeItem(id: string, params: {
  name?: string;
  amount?: string;
  unit?: string;
  category?: string;
}): Promise<{ success: boolean; message?: string }> {
  const res = await put(`/v1/app/fridge/${id}`, params, { withToken: true });
  return { success: res.success, message: res.message };
}

/**
 * 删除冰箱食材
 */
export async function deleteFridgeItem(id: string): Promise<{ success: boolean; message?: string }> {
  const res = await del(`/v1/app/fridge/${id}`, {}, { withToken: true });
  return { success: res.success, message: res.message };
}

/**
 * 清空冰箱
 */
export async function clearAllFridge(): Promise<{ success: boolean; message?: string }> {
  const res = await del('/v1/app/fridge', {}, { withToken: true });
  return { success: res.success, message: res.message };
}
