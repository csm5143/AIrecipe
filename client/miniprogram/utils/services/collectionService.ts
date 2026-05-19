/**
 * 收藏服务 - API + 本地缓存降级
 * 整合 httpApi/collection 与 Storage，作为收藏夹数据的唯一入口
 */
import * as collectionApi from '../../httpApi/collection';
import { cacheService } from './cacheService';

const CACHE_KEY = 'collections_v3';
const CACHE_TTL = 10 * 60 * 1000; // 10min

export * from '../../httpApi/collection';

/** 获取收藏夹列表（带缓存） */
export async function getCollectionsWithCache(): Promise<collectionApi.Collection[]> {
  const data = await cacheService.getOrFetch(
    CACHE_KEY,
    async () => {
      const res = await collectionApi.getMyCollections();
      if (res.success && res.data) return res.data;
      throw new Error(res.message || '获取收藏夹失败');
    },
    CACHE_TTL
  );
  return data || [];
}

/** 刷新收藏夹缓存 */
export async function refreshCollectionsCache(): Promise<collectionApi.Collection[]> {
  const data = await cacheService.refresh(
    CACHE_KEY,
    async () => {
      const res = await collectionApi.getMyCollections();
      if (res.success && res.data) return res.data;
      throw new Error(res.message || '获取收藏夹失败');
    },
    CACHE_TTL
  );
  return data || [];
}

/** 创建收藏夹（更新缓存） */
export async function createCollectionCached(params: {
  name: string;
  description?: string;
  isPublic?: boolean;
}): Promise<{ success: boolean; message: string; collectionId?: number }> {
  const res = await collectionApi.createCollection(params);
  if (res.success) {
    await refreshCollectionsCache();
  }
  return res;
}

/** 删除收藏夹（更新缓存） */
export async function deleteCollectionCached(id: number): Promise<{ success: boolean; message: string }> {
  const res = await collectionApi.deleteCollection(id);
  if (res.success) {
    await refreshCollectionsCache();
  }
  return res;
}

/** 添加菜谱到收藏夹（更新缓存） */
export async function addFavoriteCached(collectionId: number, recipeId: number): Promise<{ success: boolean; message: string }> {
  const res = await collectionApi.addFavorite(collectionId, recipeId);
  if (res.success) {
    await refreshCollectionsCache();
  }
  return res;
}

/** 从收藏夹移除菜谱（更新缓存） */
export async function removeFavoriteCached(collectionId: number, recipeId: number): Promise<{ success: boolean; message: string }> {
  const res = await collectionApi.removeFavorite(collectionId, recipeId);
  if (res.success) {
    await refreshCollectionsCache();
  }
  return res;
}

/** 获取收藏夹详情（带缓存） */
export async function getCollectionDetailCached(id: number) {
  const cacheKey = `collection_detail_${id}`;
  const data = await cacheService.getOrFetch(
    cacheKey,
    async () => {
      const res = await collectionApi.getCollectionDetail(id);
      if (res.success && res.data) return res.data;
      throw new Error(res.message || '获取收藏夹详情失败');
    },
    CACHE_TTL
  );
  return data;
}
