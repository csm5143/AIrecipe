// 收藏夹云端同步管理
// 负责收藏夹和收藏记录的云端存储与同步

import {
  Collection,
  Favorite,
  CollectionCreateParams,
  LocalCollectionsData
} from '../types/index';
import {
  getLocalCollectionsData,
  saveLocalCollectionsData,
  getUnsyncedCollections,
  markAllCollectionsSynced,
  markCollectionSynced,
  generateFavoriteId
} from './collections';

// 云数据库集合名称
const COLLECTIONS_COLLECTION = 'collections';
const FAVORITES_COLLECTION = 'favorites';

// 缓存Key
const CACHE_KEY_COLLECTIONS = 'cloud_collections_cache';
const CACHE_KEY_FAVORITES = 'cloud_favorites_cache';
const CACHE_KEY_SYNC_META = 'cloud_sync_meta';

// 缓存过期时间：24小时
const CACHE_EXPIRE_MS = 24 * 60 * 60 * 1000;

// ==================== 类型定义 ====================

interface CloudCollection {
  _id: string;
  collectionId: string;
  userId: string;
  name: string;
  coverImage?: string;
  description?: string;
  recipeCount: number;
  isDefault: boolean;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

interface CloudFavorite {
  _id: string;
  userId: string;
  recipeId: string;
  collectionId: string;
  createdAt: number;
}

interface SyncMeta {
  lastFullSync: number;
  version: number;
}

// ==================== 云服务可用性检查 ====================

function isCloudAvailable(): boolean {
  try {
    return !!(wx.cloud && typeof wx.cloud.init === 'function');
  } catch (e) {
    return false;
  }
}

// ==================== 缓存管理 ====================

function getCache<T>(key: string, defaultValue: T): T {
  try {
    const raw = wx.getStorageSync(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      // 检查缓存是否过期
      if (parsed && parsed._cacheTime && Date.now() - parsed._cacheTime < CACHE_EXPIRE_MS) {
        return parsed.data;
      }
    }
  } catch (e) {
    console.warn('[CloudCollections] 读取缓存失败', e);
  }
  return defaultValue;
}

function setCache<T>(key: string, data: T): void {
  try {
    const wrapped = {
      data,
      _cacheTime: Date.now()
    };
    wx.setStorageSync(key, JSON.stringify(wrapped));
  } catch (e) {
    console.warn('[CloudCollections] 写入缓存失败', e);
  }
}

function clearCache(): void {
  try {
    wx.removeStorageSync(CACHE_KEY_COLLECTIONS);
    wx.removeStorageSync(CACHE_KEY_FAVORITES);
    wx.removeStorageSync(CACHE_KEY_SYNC_META);
  } catch (e) {
    console.warn('[CloudCollections] 清除缓存失败', e);
  }
}

// ==================== 获取用户标识 ====================

function getUserId(): string | null {
  try {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      const info = typeof userInfo === 'string' ? JSON.parse(userInfo) : userInfo;
      if (info.openid) {
        return info.openid;
      }
      if (info.anonymousId) {
        return info.anonymousId;
      }
    }
  } catch (e) {
    console.error('[CloudCollections] 获取用户ID失败', e);
  }
  return null;
}

// ==================== 云数据库操作 ====================

/**
 * 从云端加载所有收藏夹
 */
export async function loadCollectionsFromCloud(): Promise<CloudCollection[]> {
  if (!isCloudAvailable()) {
    console.warn('[CloudCollections] 云开发不可用');
    return [];
  }

  try {
    const userId = getUserId();
    if (!userId) {
      console.warn('[CloudCollections] 未获取到用户ID');
      return [];
    }

    const db = wx.cloud.database();
    const result = await db.collection(COLLECTIONS_COLLECTION)
      .where({ userId })
      .orderBy('sortOrder', 'asc')
      .get();

    return result.data as CloudCollection[];
  } catch (e) {
    console.error('[CloudCollections] 从云端加载收藏夹失败', e);
    return [];
  }
}

/**
 * 从云端加载指定收藏夹的收藏记录
 */
export async function loadFavoritesFromCloud(collectionId?: string): Promise<CloudFavorite[]> {
  if (!isCloudAvailable()) {
    return [];
  }

  try {
    const userId = getUserId();
    if (!userId) {
      return [];
    }

    const db = wx.cloud.database();
    let query = db.collection(FAVORITES_COLLECTION)
      .where({ userId });

    if (collectionId) {
      query = query.where({ collectionId });
    }

    const result = await query.get();
    return result.data as CloudFavorite[];
  } catch (e) {
    console.error('[CloudCollections] 从云端加载收藏记录失败', e);
    return [];
  }
}

/**
 * 将收藏夹保存到云端
 */
export async function saveCollectionToCloud(collection: Collection): Promise<boolean> {
  if (!isCloudAvailable()) {
    return false;
  }

  try {
    const db = wx.cloud.database();
    const cloudData = {
      collectionId: collection.id,
      userId: collection.userId,
      name: collection.name,
      coverImage: collection.coverImage || '',
      description: collection.description || '',
      recipeCount: collection.recipeCount,
      isDefault: collection.isDefault,
      sortOrder: collection.sortOrder,
      updatedAt: Date.now()
    };

    // 尝试更新（如果已存在）
    const existResult = await db.collection(COLLECTIONS_COLLECTION)
      .where({ collectionId: collection.id })
      .limit(1)
      .get();

    if (existResult.data && existResult.data.length > 0) {
      // 更新
      await db.collection(COLLECTIONS_COLLECTION)
        .doc(existResult.data[0]._id)
        .update({ data: cloudData });
    } else {
      // 新增
      cloudData.createdAt = Date.now();
      await db.collection(COLLECTIONS_COLLECTION).add({ data: cloudData });
    }

    return true;
  } catch (e) {
    console.error('[CloudCollections] 保存收藏夹到云端失败', e);
    return false;
  }
}

/**
 * 批量保存收藏夹到云端
 */
export async function batchSaveCollectionsToCloud(collections: Collection[]): Promise<number> {
  if (!isCloudAvailable() || collections.length === 0) {
    return 0;
  }

  let successCount = 0;
  const userId = getUserId();
  if (!userId) return 0;

  const db = wx.cloud.database();

  for (const collection of collections) {
    try {
      const cloudData = {
        collectionId: collection.id,
        userId,
        name: collection.name,
        coverImage: collection.coverImage || '',
        description: collection.description || '',
        recipeCount: collection.recipeCount,
        isDefault: collection.isDefault,
        sortOrder: collection.sortOrder,
        updatedAt: Date.now()
      };

      // 检查是否存在
      const existResult = await db.collection(COLLECTIONS_COLLECTION)
        .where({ collectionId: collection.id })
        .limit(1)
        .get();

      if (existResult.data && existResult.data.length > 0) {
        await db.collection(COLLECTIONS_COLLECTION)
          .doc(existResult.data[0]._id)
          .update({ data: cloudData });
      } else {
        cloudData.createdAt = Date.now();
        await db.collection(COLLECTIONS_COLLECTION).add({ data: cloudData });
      }

      successCount++;
    } catch (e) {
      console.error('[CloudCollections] 批量保存收藏夹失败', collection.id, e);
    }
  }

  return successCount;
}

/**
 * 删除云端收藏夹（同时删除关联的收藏记录）
 */
export async function deleteCollectionFromCloud(collectionId: string): Promise<boolean> {
  if (!isCloudAvailable()) {
    return false;
  }

  try {
    const db = wx.cloud.database();

    // 1. 删除收藏夹
    const collectionResult = await db.collection(COLLECTIONS_COLLECTION)
      .where({ collectionId })
      .limit(1)
      .get();

    if (collectionResult.data && collectionResult.data.length > 0) {
      await db.collection(COLLECTIONS_COLLECTION)
        .doc(collectionResult.data[0]._id)
        .remove();
    }

    // 2. 删除关联的收藏记录
    const userId = getUserId();
    if (userId) {
      const favoriteResult = await db.collection(FAVORITES_COLLECTION)
        .where({
          userId,
          collectionId
        })
        .get();

      if (favoriteResult.data && favoriteResult.data.length > 0) {
        // 批量删除
        const batchTasks = favoriteResult.data.map(fav =>
          db.collection(FAVORITES_COLLECTION).doc(fav._id).remove()
        );
        await Promise.all(batchTasks);
      }
    }

    return true;
  } catch (e) {
    console.error('[CloudCollections] 删除云端收藏夹失败', e);
    return false;
  }
}

/**
 * 添加收藏记录到云端
 */
export async function addFavoriteToCloud(
  userId: string,
  recipeId: string,
  collectionId: string
): Promise<boolean> {
  if (!isCloudAvailable()) {
    return false;
  }

  try {
    const db = wx.cloud.database();

    // 检查是否已存在（防止重复）
    const existResult = await db.collection(FAVORITES_COLLECTION)
      .where({
        userId,
        recipeId,
        collectionId
      })
      .limit(1)
      .get();

    if (existResult.data && existResult.data.length > 0) {
      return true; // 已存在
    }

    await db.collection(FAVORITES_COLLECTION).add({
      data: {
        userId,
        recipeId,
        collectionId,
        createdAt: Date.now()
      }
    });

    return true;
  } catch (e) {
    console.error('[CloudCollections] 添加收藏记录失败', e);
    return false;
  }
}

/**
 * 批量添加收藏记录到云端
 */
export async function batchAddFavoritesToCloud(
  userId: string,
  favorites: Array<{ recipeId: string; collectionId: string }>
): Promise<number> {
  if (!isCloudAvailable() || favorites.length === 0) {
    return 0;
  }

  let successCount = 0;
  const db = wx.cloud.database();

  for (const fav of favorites) {
    try {
      // 检查是否已存在
      const existResult = await db.collection(FAVORITES_COLLECTION)
        .where({
          userId,
          recipeId: fav.recipeId,
          collectionId: fav.collectionId
        })
        .limit(1)
        .get();

      if (!existResult.data || existResult.data.length === 0) {
        await db.collection(FAVORITES_COLLECTION).add({
          data: {
            userId,
            recipeId: fav.recipeId,
            collectionId: fav.collectionId,
            createdAt: Date.now()
          }
        });
      }

      successCount++;
    } catch (e) {
      console.error('[CloudCollections] 批量添加收藏记录失败', fav.recipeId, e);
    }
  }

  return successCount;
}

/**
 * 从云端删除收藏记录
 */
export async function removeFavoriteFromCloud(
  userId: string,
  recipeId: string,
  collectionId: string
): Promise<boolean> {
  if (!isCloudAvailable()) {
    return false;
  }

  try {
    const db = wx.cloud.database();
    const result = await db.collection(FAVORITES_COLLECTION)
      .where({
        userId,
        recipeId,
        collectionId
      })
      .limit(1)
      .get();

    if (result.data && result.data.length > 0) {
      await db.collection(FAVORITES_COLLECTION)
        .doc(result.data[0]._id)
        .remove();
    }

    return true;
  } catch (e) {
    console.error('[CloudCollections] 删除收藏记录失败', e);
    return false;
  }
}

/**
 * 批量从云端删除收藏记录
 */
export async function batchRemoveFavoritesFromCloud(
  userId: string,
  favorites: Array<{ recipeId: string; collectionId: string }>
): Promise<number> {
  if (!isCloudAvailable() || favorites.length === 0) {
    return 0;
  }

  let successCount = 0;
  const db = wx.cloud.database();

  for (const fav of favorites) {
    try {
      const result = await db.collection(FAVORITES_COLLECTION)
        .where({
          userId,
          recipeId: fav.recipeId,
          collectionId: fav.collectionId
        })
        .limit(1)
        .get();

      if (result.data && result.data.length > 0) {
        await db.collection(FAVORITES_COLLECTION)
          .doc(result.data[0]._id)
          .remove();
        successCount++;
      }
    } catch (e) {
      console.error('[CloudCollections] 批量删除收藏记录失败', fav.recipeId, e);
    }
  }

  return successCount;
}

// ==================== 数据同步 ====================

/**
 * 全量同步：上传所有未同步的收藏夹和收藏记录
 */
export async function syncCollectionsToCloud(): Promise<{
  success: boolean;
  collectionsSynced: number;
  favoritesSynced: number;
  message?: string;
}> {
  if (!isCloudAvailable()) {
    return {
      success: false,
      collectionsSynced: 0,
      favoritesSynced: 0,
      message: '云开发不可用'
    };
  }

  try {
    const userId = getUserId();
    if (!userId) {
      return {
        success: false,
        collectionsSynced: 0,
        favoritesSynced: 0,
        message: '用户未登录'
      };
    }

    const localData = getLocalCollectionsData();
    const unsynced = getUnsyncedCollections();

    if (unsynced.length === 0) {
      return {
        success: true,
        collectionsSynced: 0,
        favoritesSynced: 0,
        message: '无需同步'
      };
    }

    // 同步收藏夹
    let collectionsSynced = 0;
    for (const collection of unsynced) {
      // 补全userId
      const collectionToSave = {
        ...collection,
        userId
      };
      const success = await saveCollectionToCloud(collectionToSave);
      if (success) {
        markCollectionSynced(collection.id);
        collectionsSynced++;
      }
    }

    // 同步所有收藏记录（简单策略：全部重新上传）
    let favoritesSynced = 0;
    const allFavorites: Array<{ recipeId: string; collectionId: string }> = [];

    for (const collection of localData.collections) {
      if (collection.recipeIds) {
        for (const recipeId of collection.recipeIds) {
          allFavorites.push({
            recipeId,
            collectionId: collection.id
          });
        }
      }
    }

    if (allFavorites.length > 0) {
      favoritesSynced = await batchAddFavoritesToCloud(userId, allFavorites);
    }

    return {
      success: true,
      collectionsSynced,
      favoritesSynced,
      message: `同步完成：${collectionsSynced}个收藏夹，${favoritesSynced}条收藏记录`
    };
  } catch (e) {
    console.error('[CloudCollections] 同步失败', e);
    return {
      success: false,
      collectionsSynced: 0,
      favoritesSynced: 0,
      message: e.message || '同步失败'
    };
  }
}

/**
 * 从云端拉取所有收藏夹和收藏记录
 */
export async function pullCollectionsFromCloud(): Promise<{
  success: boolean;
  collectionsPulled: number;
  favoritesPulled: number;
  message?: string;
}> {
  if (!isCloudAvailable()) {
    return {
      success: false,
      collectionsPulled: 0,
      favoritesPulled: 0,
      message: '云开发不可用'
    };
  }

  try {
    const userId = getUserId();
    if (!userId) {
      return {
        success: false,
        collectionsPulled: 0,
        favoritesPulled: 0,
        message: '用户未登录'
      };
    }

    // 1. 拉取收藏夹
    const cloudCollections = await loadCollectionsFromCloud();

    if (cloudCollections.length === 0) {
      return {
        success: true,
        collectionsPulled: 0,
        favoritesPulled: 0,
        message: '云端暂无收藏夹数据'
      };
    }

    // 2. 转换为本地格式
    const now = Date.now();
    const newCollections: Collection[] = cloudCollections.map(cc => ({
      id: cc.collectionId,
      userId: cc.userId,
      name: cc.name,
      coverImage: cc.coverImage,
      description: cc.description,
      recipeCount: cc.recipeCount,
      isDefault: cc.isDefault,
      sortOrder: cc.sortOrder,
      createdAt: cc.createdAt,
      updatedAt: cc.updatedAt,
      recipeIds: [], // 稍后填充
      synced: true
    }));

    // 3. 拉取所有收藏记录
    const cloudFavorites = await loadFavoritesFromCloud();

    // 4. 将收藏记录映射到收藏夹
    const favoritesByCollection = new Map<string, string[]>();
    for (const fav of cloudFavorites) {
      if (!favoritesByCollection.has(fav.collectionId)) {
        favoritesByCollection.set(fav.collectionId, []);
      }
      favoritesByCollection.get(fav.collectionId)!.push(fav.recipeId);
    }

    // 5. 填充recipeIds
    newCollections.forEach(col => {
      col.recipeIds = favoritesByCollection.get(col.id) || [];
      col.recipeCount = col.recipeIds.length;
    });

    // 6. 合并到本地数据
    const localData = getLocalCollectionsData();

    // 按collectionId合并：云端数据优先（覆盖本地）
    const mergedMap = new Map<string, Collection>();

    // 先添加云端数据
    for (const col of newCollections) {
      mergedMap.set(col.id, col);
    }

    // 补充本地有但云端没有的数据（可能是新创建未同步的）
    for (const localCol of localData.collections) {
      if (!mergedMap.has(localCol.id)) {
        mergedMap.set(localCol.id, localCol);
      }
    }

    const mergedCollections = Array.from(mergedMap.values());
    mergedCollections.sort((a, b) => a.sortOrder - b.sortOrder);

    // 7. 更新本地数据
    const newActiveId = localData.activeCollectionId;
    const hasDefault = mergedCollections.some(c => c.isDefault);
    if (!hasDefault && mergedCollections.length > 0) {
      mergedCollections[0].isDefault = true;
    }

    const updatedLocalData: LocalCollectionsData = {
      collections: mergedCollections,
      activeCollectionId: newActiveId,
      version: localData.version + 1,
      lastSyncTime: now
    };

    saveLocalCollectionsData(updatedLocalData);

    return {
      success: true,
      collectionsPulled: newCollections.length,
      favoritesPulled: cloudFavorites.length,
      message: `拉取完成：${newCollections.length}个收藏夹，${cloudFavorites.length}条收藏`
    };
  } catch (e) {
    console.error('[CloudCollections] 拉取云端数据失败', e);
    return {
      success: false,
      collectionsPulled: 0,
      favoritesPulled: 0,
      message: e.message || '拉取失败'
    };
  }
}

/**
 * 双向同步：先拉取云端最新数据，再推送本地修改
 */
export async function syncCollectionsTwoWay(): Promise<{
  success: boolean;
  pulled: number;
  pushed: number;
  message: string;
}> {
  // 1. 先拉取
  const pullResult = await pullCollectionsFromCloud();

  if (!pullResult.success) {
    return {
      success: false,
      pulled: 0,
      pushed: 0,
      message: '拉取失败：' + (pullResult.message || '未知错误')
    };
  }

  // 2. 再推送
  const pushResult = await syncCollectionsToCloud();

  if (!pushResult.success) {
    return {
      success: false,
      pulled: pullResult.collectionsPulled,
      pushed: 0,
      message: '推送失败：' + (pushResult.message || '未知错误')
    };
  }

  return {
    success: true,
    pulled: pullResult.collectionsPulled,
    pushed: pushResult.collectionsSynced,
    message: `同步完成（拉取${pullResult.collectionsPulled}，推送${pushResult.collectionsSynced}）`
  };
}

/**
 * 获取同步元数据
 */
export function getSyncMeta(): SyncMeta {
  try {
    const raw = wx.getStorageSync(CACHE_KEY_SYNC_META);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('[CloudCollections] 读取同步元数据失败', e);
  }
  return {
    lastFullSync: 0,
    version: 1
  };
}

/**
 * 保存同步元数据
 */
function saveSyncMeta(meta: SyncMeta): void {
  try {
    wx.setStorageSync(CACHE_KEY_SYNC_META, JSON.stringify(meta));
  } catch (e) {
    console.warn('[CloudCollections] 保存同步元数据失败', e);
  }
}

// ==================== 数据迁移（测试版禁用） ====================

/**
 * 迁移旧版收藏数据（测试版已禁用）
 * 注意：测试版暂不启用自动迁移，直接返回false
 */
export function migrateOldFavoritesIfNeeded(): boolean {
  console.log('[CloudCollections] 数据迁移已禁用（测试版）');
  return false;
}

/**
 * 检查是否需要迁移旧数据（测试版已禁用）
 * 注意：测试版始终返回false，不执行迁移
 */
export function checkAndMigrateIfNeeded(): boolean {
  return false;
}
