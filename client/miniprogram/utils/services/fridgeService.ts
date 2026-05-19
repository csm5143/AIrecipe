/**
 * 冰箱服务 - API + 本地缓存降级
 * 整合 httpApi/fridge 与 Storage 缓存，作为冰箱数据的唯一入口
 */
import * as fridgeApi from '../../httpApi/fridge';
import { cacheService } from './cacheService';

const CACHE_KEY = 'fridge_items';
const CACHE_TTL = 5 * 60 * 1000; // 5min

export * from '../../httpApi/fridge';

// ============ 带缓存的 API 方法 ============

/** 获取冰箱食材（带缓存 + API 刷新） */
export async function getFridgeItemsWithCache(): Promise<fridgeApi.FridgeItem[]> {
  const data = await cacheService.getOrFetch(
    CACHE_KEY,
    async () => {
      const res = await fridgeApi.getFridgeItems();
      if (res.success && res.data) return res.data;
      throw new Error(res.message || '获取冰箱数据失败');
    },
    CACHE_TTL
  );
  return data || [];
}

/** 刷新冰箱缓存（强制从 API 拉取） */
export async function refreshFridgeCache(): Promise<fridgeApi.FridgeItem[]> {
  const data = await cacheService.refresh(
    CACHE_KEY,
    async () => {
      const res = await fridgeApi.getFridgeItems();
      if (res.success && res.data) return res.data;
      throw new Error(res.message || '获取冰箱数据失败');
    },
    CACHE_TTL
  );
  return data || [];
}

/** 添加食材（更新缓存） */
export async function addToFridgeCached(params: {
  name: string;
  amount?: string;
  unit?: string;
  category?: string;
}): Promise<{ success: boolean; item?: fridgeApi.FridgeItem; message: string }> {
  const res = await fridgeApi.addFridgeItem(params);
  if (res.success) {
    // 刷新缓存
    await refreshFridgeCache();
  }
  return res;
}

/** 批量添加食材（更新缓存） */
export async function addBatchCached(items: Array<{
  name: string;
  amount?: string;
  unit?: string;
  category?: string;
}>): Promise<{ success: boolean; message: string }> {
  const res = await fridgeApi.addFridgeItemsBatch(items);
  if (res.success) {
    await refreshFridgeCache();
  }
  return res;
}

/** 删除食材（更新缓存） */
export async function deleteFridgeItemCached(id: string): Promise<{ success: boolean; message: string }> {
  const res = await fridgeApi.deleteFridgeItem(id);
  await refreshFridgeCache();
  return res;
}

/** 清空冰箱（更新缓存） */
export async function clearAllCached(): Promise<{ success: boolean; message: string }> {
  const res = await fridgeApi.clearAllFridge();
  cacheService.remove(CACHE_KEY);
  return res;
}
