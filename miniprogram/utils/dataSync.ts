/**
 * 数据同步管理
 * 统一管理用户数据的本地与云端同步
 */

import {
  saveUserDataToCloud,
  getUserDataFromCloud,
  mergeCloudDataToLocal,
  clearUserDataCache,
  type UserCloudData,
  type BasketData,
  type FitnessGoal,
  type ChildrenStage
} from './cloudUserData';

// 旧版收藏接口（保留兼容）
import { getFavorites, saveFavorites } from './favorites';

// 新版收藏夹系统
import { syncCollectionsToCloud, pullCollectionsFromCloud } from './cloudCollections';
import { getUnsyncedCollections } from './collections';

import { getBasket } from './shoppingList';
import { isFormalUser, getUserInfo } from './userAuth';

// 同步状态
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

// 同步配置
const SYNC_DEBOUNCE_MS = 2000;  // 2秒防抖
const AUTO_SYNC_INTERVAL_MS = 5 * 60 * 1000;  // 5分钟自动同步一次

// 当前同步状态
let currentSyncStatus: SyncStatus = 'idle';
let lastSyncTime: number = 0;
let syncTimer: number | null = null;

/**
 * 获取当前同步状态
 */
export function getSyncStatus(): SyncStatus {
  return currentSyncStatus;
}

/**
 * 获取上次同步时间
 */
export function getLastSyncTime(): number {
  return lastSyncTime;
}

/**
 * 同步所有用户数据到云端
 */
export async function syncAllDataToCloud(): Promise<boolean> {
  if (currentSyncStatus === 'syncing') {
    console.log('[DataSync] 同步正在进行中，跳过');
    return false;
  }

  currentSyncStatus = 'syncing';

  try {
    const info = getUserInfo();
    if (!info.loginState) {
      console.log('[DataSync] 用户未登录，跳过同步');
      currentSyncStatus = 'idle';
      return false;
    }

    // 构建要同步的数据
    const cloudData: Partial<UserCloudData> = {
      // 用户资料
      nickname: info.nickname || '',
      avatar: info.avatar || '',

      // 收藏列表
      favorites: getFavorites(),

      // 小菜篮数据
      basket: {
        entries: getBasket()
      },

      // 健身目标
      fitnessGoal: getFitnessGoalFromStorage(),

      // 儿童信息
      childrenStage: getChildrenStageFromStorage()
    };

    // 保存到云端
    const success = await saveUserDataToCloud(cloudData as UserCloudData);

    if (success) {
      currentSyncStatus = 'success';
      lastSyncTime = Date.now();
      console.log('[DataSync] 数据同步成功');
    } else {
      currentSyncStatus = 'error';
      console.warn('[DataSync] 数据同步失败');
    }

    return success;
  } catch (e) {
    currentSyncStatus = 'error';
    console.error('[DataSync] 同步出错', e);
    return false;
  }
}

/**
 * 防抖同步（用于频繁操作如收藏）
 * 同时触发收藏夹和旧版收藏的同步
 */
let syncDebounceTimer: number | null = null;
export function syncDebounced(): void {
  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
  }
  syncDebounceTimer = setTimeout(async () => {
    // 同步收藏夹数据
    const unsynced = getUnsyncedCollections();
    if (unsynced.length > 0) {
      syncCollectionsToCloud();
    }
    // 同时保留旧版收藏同步（兼容）
    syncAllDataToCloud();
    syncDebounceTimer = null;
  }, SYNC_DEBOUNCE_MS) as unknown as number;
}

/**
 * 同步收藏列表（同时带上用户资料）
 */
export async function syncFavorites(): Promise<boolean> {
  try {
    const info = getUserInfo();
    const favorites = getFavorites();
    const cloudData: Partial<UserCloudData> = {
      nickname: info.nickname || '',
      avatar: info.avatar || '',
      favorites
    };
    return await saveUserDataToCloud(cloudData as UserCloudData);
  } catch (e) {
    console.error('[DataSync] 同步收藏失败', e);
    return false;
  }
}

/**
 * 同步小菜篮（同时带上用户资料）
 */
export async function syncBasket(): Promise<boolean> {
  try {
    const info = getUserInfo();
    const basketData: BasketData = {
      entries: getBasket()
    };
    const cloudData: Partial<UserCloudData> = {
      nickname: info.nickname || '',
      avatar: info.avatar || '',
      basket: basketData
    };
    return await saveUserDataToCloud(cloudData as UserCloudData);
  } catch (e) {
    console.error('[DataSync] 同步小菜篮失败', e);
    return false;
  }
}

/**
 * 同步收藏夹数据到云端
 */
export async function syncCollections(): Promise<boolean> {
  try {
    const result = await syncCollectionsToCloud();
    return result.success;
  } catch (e) {
    console.error('[DataSync] 同步收藏夹失败', e);
    return false;
  }
}

/**
 * 从云端恢复数据到本地
 */
export async function restoreFromCloud(): Promise<boolean> {
  try {
    const success = await mergeCloudDataToLocal();
    if (success) {
      console.log('[DataSync] 数据恢复成功');
    }
    return success;
  } catch (e) {
    console.error('[DataSync] 数据恢复失败', e);
    return false;
  }
}

/**
 * 启动自动同步
 */
export function startAutoSync(): void {
  if (syncTimer) {
    return; // 已启动
  }

  syncTimer = setInterval(() => {
    const info = getUserInfo();
    if (info.loginState) {
      syncAllDataToCloud();
    }
  }, AUTO_SYNC_INTERVAL_MS) as unknown as number;

  console.log('[DataSync] 自动同步已启动');
}

/**
 * 停止自动同步
 */
export function stopAutoSync(): void {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
    console.log('[DataSync] 自动同步已停止');
  }
}

/**
 * 清除所有同步相关缓存
 */
export function clearSyncCache(): void {
  clearUserDataCache();
  currentSyncStatus = 'idle';
  lastSyncTime = 0;
}

/**
 * 获取格式化的时间
 */
export function formatLastSyncTime(): string {
  if (!lastSyncTime) {
    return '从未同步';
  }

  const now = Date.now();
  const diff = now - lastSyncTime;

  if (diff < 60 * 1000) {
    return '刚刚';
  } else if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / 60 / 1000)}分钟前`;
  } else if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / 60 / 60 / 1000)}小时前`;
  } else {
    const date = new Date(lastSyncTime);
    return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
}

// ==================== 辅助函数 ====================

function getFitnessGoalFromStorage(): FitnessGoal | undefined {
  try {
    const raw = wx.getStorageSync('fitnessGoal');
    if (raw) {
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    }
  } catch (e) {}
  return undefined;
}

function getChildrenStageFromStorage(): ChildrenStage | undefined {
  try {
    const raw = wx.getStorageSync('childrenStage');
    if (raw) {
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    }
  } catch (e) {}
  return undefined;
}

// ==================== 导出类型 ====================

export { type BasketData, type FitnessGoal, type ChildrenStage };
