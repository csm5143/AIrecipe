/**
 * 收藏夹相关 API
 */
import { get, post, del, put } from './request';
import type { Collection, PaginatedQuery } from '@/types';

// 获取用户收藏夹列表
export function getCollections() {
  return get<ApiResponse<Collection[]>>('/collections');
}

// 获取收藏夹详情
export function getCollectionDetail(id: number) {
  return get<ApiResponse<Collection & { recipes: any[] }>>(`/collections/${id}`);
}

// 创建收藏夹
export function createCollection(data: { name: string; description?: string; isPublic?: boolean }) {
  return post<ApiResponse<Collection>>('/collections', { data });
}

// 更新收藏夹
export function updateCollection(id: number, data: Partial<Collection>) {
  return put<ApiResponse<Collection>>(`/collections/${id}`, { data });
}

// 删除收藏夹
export function deleteCollection(id: number) {
  return del<ApiResponse<null>>(`/collections/${id}`);
}

// 添加食谱到收藏夹
export function addToCollection(collectionId: number, recipeId: number) {
  return post<ApiResponse<null>>(`/collections/${collectionId}/items`, {
    data: { recipeId },
  });
}

// 从收藏夹移除食谱
export function removeFromCollection(collectionId: number, recipeId: number) {
  return del<ApiResponse<null>>(`/collections/${collectionId}/items/${recipeId}`);
}
