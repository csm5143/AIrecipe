/**
 * 用户数据服务 - 替换 wx.cloud 数据库操作
 * 对接后端 /api/v1/wx/app/*（收藏夹、反馈等用户数据）
 */

import * as collectionApi from '../httpApi/collection';
import * as feedbackApi from '../httpApi/feedback';
import { isLoggedIn } from './auth';

/** 检查登录 */
export function checkLogin(): boolean {
  return isLoggedIn();
}

/** 获取收藏夹列表 */
export async function fetchMyCollections(): Promise<collectionApi.Collection[]> {
  const res = await collectionApi.getMyCollections();
  return (res.success && res.data) ? res.data : [];
}

/** 创建收藏夹 */
export async function createCollection(params: {
  name: string; description?: string; isPublic?: boolean;
}): Promise<{ success: boolean; message: string; collectionId?: number }> {
  return collectionApi.createCollection(params);
}

/** 删除收藏夹 */
export async function deleteCollection(id: number): Promise<{ success: boolean; message: string }> {
  return collectionApi.deleteCollection(id);
}

/** 添加收藏 */
export async function addFavorite(collectionId: number, recipeId: number): Promise<{ success: boolean; message: string }> {
  return collectionApi.addFavorite(collectionId, recipeId);
}

/** 移除收藏 */
export async function removeFavorite(collectionId: number, recipeId: number): Promise<{ success: boolean; message: string }> {
  return collectionApi.removeFavorite(collectionId, recipeId);
}

/** 获取收藏夹详情 */
export async function fetchCollectionDetail(id: number): Promise<any> {
  const res = await collectionApi.getCollectionDetail(id);
  return res.data || null;
}

/** 提交反馈 */
export async function submitFeedback(params: {
  type: string; content: string; contact?: string; images?: string[];
}): Promise<{ success: boolean; message: string; feedbackId?: string }> {
  return feedbackApi.submitFeedback(params);
}

/** 获取我的反馈历史 */
export async function fetchMyFeedbacks(page = 1, pageSize = 20): Promise<{
  list: any[]; total: number; hasMore: boolean;
}> {
  const res = await feedbackApi.getMyFeedbacks(page, pageSize);
  return { list: res.data || [], total: res.total || 0, hasMore: res.hasMore || false };
}

/** 获取反馈状态 */
export async function fetchFeedbackStatus(feedbackId: number): Promise<any | null> {
  const res = await feedbackApi.getFeedbackDetail(feedbackId);
  return res.data || null;
}
