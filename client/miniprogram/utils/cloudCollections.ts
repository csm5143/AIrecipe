/**
 * 收藏夹云同步（stub - 云开发已移除）
 * 收藏夹数据通过本地 Storage + httpApi/collection 管理
 * 保留接口签名，让旧代码不崩溃
 */

import * as collectionApi from './httpApi/collection.js';

export interface SyncResult {
  success: boolean;
  message?: string;
}

/**
 * 检查并迁移旧收藏数据到多收藏夹系统
 * 返回是否发生了迁移
 */
export function checkAndMigrateIfNeeded(): boolean {
  console.warn('[cloudCollections] 云开发已移除，跳过迁移检查');
  return false;
}

/**
 * 同步收藏夹到云端（stub）
 * 数据通过 httpApi/collection 管理，本地存储为最终来源
 */
export async function syncCollectionsToCloud(): Promise<SyncResult> {
  console.warn('[cloudCollections] 云开发已移除，同步跳过');
  return { success: true, message: '云开发已移除，跳过同步' };
}

/**
 * 从云端拉取收藏夹数据（stub）
 * 数据通过 httpApi/collection 管理
 */
export async function pullCollectionsFromCloud(): Promise<SyncResult> {
  console.warn('[cloudCollections] 云开发已移除，拉取跳过');
  return { success: true, message: '云开发已移除，跳过拉取' };
}
