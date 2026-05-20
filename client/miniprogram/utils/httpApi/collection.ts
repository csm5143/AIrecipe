/**
 * 收藏夹 API - 对接后端 /v1/wx/app/*
 * 小程序用户的收藏夹由 /v1/wx/app/ 路由提供
 */

import { get, post, put, del } from './request.js';

// ============ 类型定义 ============

export interface Collection {
  id: number;
  name: string;
  coverImage?: string;
  description?: string;
  isPublic?: boolean;
  itemCount?: number;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionItem {
  id: number;
  recipeId: number;
  note?: string;
  createdAt: string;
}

// ============ API ============

/**
 * 获取用户的收藏夹列表
 * 对应后端 GET /v1/wx/app/my-collections
 */
export async function getMyCollections(): Promise<{
  success: boolean; data?: Collection[];
}> {
  const res = await get<Collection[]>('/v1/wx/app/my-collections', undefined, { withToken: true });
  return { success: res.success, data: res.data };
}

/**
 * 创建收藏夹
 * 对应后端 POST /wx/app/collections
 */
export async function createCollection(params: {
  name: string;
  description?: string;
  isPublic?: boolean;
}): Promise<{ success: boolean; message: string; collectionId?: number }> {
  const res = await post<{ id: number }>('/v1/wx/app/collections', params, { withToken: true });
  return {
    success: res.success,
    message: res.message || '',
    collectionId: res.data?.id,
  };
}

/**
 * 更新收藏夹
 * 对应后端 PUT /wx/app/collections/:id
 */
export async function updateCollection(id: number, params: {
  name?: string;
  description?: string;
  coverImage?: string;
}): Promise<{ success: boolean; message: string }> {
  const res = await put(`/v1/wx/app/collections/${id}`, params, { withToken: true });
  return { success: res.success, message: res.message || '' };
}

/**
 * 删除收藏夹
 * 对应后端 DELETE /v1/wx/app/collections/:id
 */
export async function deleteCollection(id: number): Promise<{ success: boolean; message: string }> {
  const res = await del(`/v1/wx/app/collections/${id}`, undefined, { withToken: true });
  return { success: res.success, message: res.message || '' };
}

/**
 * 获取收藏夹详情（含收藏的菜谱）
 * 对应后端 GET /v1/wx/app/collections/:id
 */
export async function getCollectionDetail(id: number): Promise<{
  success: boolean; data?: Collection & { recipes: any[] };
}> {
  const res = await get(`/v1/wx/app/collections/${id}`, undefined, { withToken: true });
  return { success: res.success, data: res.data };
}

/**
 * 添加收藏
 * 对应后端 POST /v1/wx/app/collections/:id/items
 */
export async function addFavorite(collectionId: number, recipeId: number): Promise<{
  success: boolean; message: string;
}> {
  const res = await post(`/v1/wx/app/collections/${collectionId}/items`, { recipeId }, { withToken: true });
  return { success: res.success, message: res.message || '' };
}

/**
 * 移除收藏
 * 对应后端 DELETE /v1/wx/app/collections/:id/items/:recipeId
 */
export async function removeFavorite(collectionId: number, recipeId: number): Promise<{
  success: boolean; message: string;
}> {
  const res = await del(`/v1/wx/app/collections/${collectionId}/items/${recipeId}`, undefined, { withToken: true });
  return { success: res.success, message: res.message || '' };
}
