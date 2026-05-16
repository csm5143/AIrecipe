// 收藏夹本地存储工具
// 管理用户的收藏夹、收藏记录等本地数据

import {
  Collection,
  Favorite,
  CollectionCreateParams,
  CollectionUpdateParams,
  LocalCollectionsData,
  FavoriteContext
} from '../types/index';

// 本地存储Key
const STORAGE_KEY = 'user_collections_v2';
const ACTIVE_COLLECTION_KEY = 'active_collection_id';

// 默认收藏夹名称前缀
const DEFAULT_COLLECTION_NAME = '我的收藏';

// 生成唯一ID
export function generateId(): string {
  return 'col_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
}

// 生成收藏记录ID
export function generateFavoriteId(): string {
  return 'fav_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
}

/**
 * 获取本地收藏夹数据
 */
export function getLocalCollectionsData(): LocalCollectionsData {
  try {
    const raw = wx.getStorageSync(STORAGE_KEY);
    if (raw) {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (parsed && typeof parsed === 'object') {
        return {
          collections: parsed.collections || [],
          activeCollectionId: parsed.activeCollectionId || '',
          version: parsed.version || 1,
          lastSyncTime: parsed.lastSyncTime || 0
        };
      }
    }
  } catch (e) {
    console.error('[Collections] 读取本地收藏夹数据失败', e);
  }
  return {
    collections: [],
    activeCollectionId: '',
    version: 1,
    lastSyncTime: 0
  };
}

/**
 * 保存本地收藏夹数据
 */
export function saveLocalCollectionsData(data: LocalCollectionsData): void {
  try {
    wx.setStorageSync(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('[Collections] 保存本地收藏夹数据失败', e);
  }
}

/**
 * 获取当前活跃收藏夹ID
 */
export function getActiveCollectionId(): string {
  try {
    const activeId = wx.getStorageSync(ACTIVE_COLLECTION_KEY);
    if (activeId) {
      return String(activeId);
    }
  } catch (e) {
    console.error('[Collections] 读取活跃收藏夹ID失败', e);
  }
  return '';
}

/**
 * 设置当前活跃收藏夹ID
 */
export function setActiveCollectionId(collectionId: string): void {
  try {
    wx.setStorageSync(ACTIVE_COLLECTION_KEY, collectionId);
  } catch (e) {
    console.error('[Collections] 保存活跃收藏夹ID失败', e);
  }
}

/**
 * 获取所有收藏夹
 */
export function getCollections(): Collection[] {
  const data = getLocalCollectionsData();
  return data.collections;
}

/**
 * 根据ID获取收藏夹
 */
export function getCollectionById(collectionId: string): Collection | null {
  const collections = getCollections();
  const found = collections.find(c => c.id === collectionId);
  return found || null;
}

/**
 * 获取默认收藏夹（每个用户至少有一个）
 */
export function getDefaultCollection(): Collection | null {
  const collections = getCollections();
  const found = collections.find(c => c.isDefault);
  return found || null;
}

/**
 * 创建收藏夹
 */
export function createCollection(params: CollectionCreateParams): Collection | null {
  const data = getLocalCollectionsData();

  // 检查名称是否重复
  const nameExists = data.collections.some(c => c.name.trim() === params.name.trim());
  if (nameExists) {
    wx.showToast({ title: '收藏夹名称已存在', icon: 'none' });
    return null;
  }

  // 限制最多10个收藏夹
  if (data.collections.length >= 10) {
    wx.showToast({ title: '最多创��10个收藏夹', icon: 'none' });
    return null;
  }

  const now = Date.now();
  const newCollection: Collection = {
    id: generateId(),
    userId: '', // 由调用方填充
    name: params.name.trim(),
    coverImage: params.coverImage || '',
    description: params.description || '',
    recipeCount: 0,
    isDefault: params.isDefault || false,
    sortOrder: data.collections.length,
    createdAt: now,
    updatedAt: now,
    recipeIds: [],
    synced: false
  };

  data.collections.push(newCollection);
  saveLocalCollectionsData(data);

  // 如果是第一个收藏夹，设置为活跃收藏夹
  if (data.collections.length === 1) {
    setActiveCollectionId(newCollection.id);
  }

  return newCollection;
}

/**
 * 更新收藏夹
 */
export function updateCollection(
  collectionId: string,
  params: CollectionUpdateParams
): boolean {
  const data = getLocalCollectionsData();
  const index = data.collections.findIndex(c => c.id === collectionId);

  if (index === -1) {
    return false;
  }

  const collection = data.collections[index];

  // 更新名称时检查重复
  if (params.name && params.name.trim() !== collection.name) {
    const nameExists = data.collections.some(
      c => c.id !== collectionId && c.name.trim() === params.name.trim()
    );
    if (nameExists) {
      wx.showToast({ title: '收藏夹名称已存在', icon: 'none' });
      return false;
    }
  }

  // 更新字段
  if (params.name !== undefined) collection.name = params.name.trim();
  if (params.coverImage !== undefined) collection.coverImage = params.coverImage;
  if (params.description !== undefined) collection.description = params.description;
  if (params.sortOrder !== undefined) collection.sortOrder = params.sortOrder;

  collection.updatedAt = Date.now();
  collection.synced = false;

  data.collections[index] = collection;
  saveLocalCollectionsData(data);

  return true;
}

/**
 * 删除收藏夹
 * 删除时会同时移除该收藏夹中所有菜品的收藏记录
 * 返回：是否删除成功
 */
export function deleteCollection(collectionId: string): boolean {
  const data = getLocalCollectionsData();
  const index = data.collections.findIndex(c => c.id === collectionId);

  if (index === -1) {
    return false;
  }

  const collection = data.collections[index];

  // 默认收藏夹不能删除
  if (collection.isDefault) {
    wx.showToast({ title: '默认收藏夹不能删除', icon: 'none' });
    return false;
  }

  // 删除收藏夹（收藏夹中的菜品关联关系会随之删除）
  data.collections.splice(index, 1);

  // 如果删除的是当前活跃收藏夹，切换到默认收藏夹
  if (getActiveCollectionId() === collectionId) {
    const defaultCol = getDefaultCollection();
    setActiveCollectionId(defaultCol ? defaultCol.id : '');
  }

  saveLocalCollectionsData(data);
  return true;
}

/**
 * 设置收藏夹排序
 */
export function reorderCollections(orders: Array<{ id: string; sortOrder: number }>): void {
  const data = getLocalCollectionsData();
  const orderMap = new Map(orders.map(o => [o.id, o.sortOrder]));

  data.collections.forEach(col => {
    if (orderMap.has(col.id)) {
      col.sortOrder = orderMap.get(col.id)!;
      col.updatedAt = Date.now();
      col.synced = false;
    }
  });

  // 按sortOrder排序
  data.collections.sort((a, b) => a.sortOrder - b.sortOrder);

  saveLocalCollectionsData(data);
}

/**
 * 清空收藏夹（移除所有菜品）
 */
export function clearCollection(collectionId: string): boolean {
  const data = getLocalCollectionsData();
  const collection = data.collections.find(c => c.id === collectionId);

  if (!collection) {
    return false;
  }

  // 清空菜品列表
  collection.recipeIds = [];
  collection.recipeCount = 0;
  collection.updatedAt = Date.now();
  collection.synced = false;

  saveLocalCollectionsData(data);
  return true;
}

/**
 * 获取收藏夹中的菜谱ID列表
 */
export function getCollectionRecipeIds(collectionId: string): string[] {
  const collection = getCollectionById(collectionId);
  if (!collection) {
    return [];
  }
  return collection.recipeIds || [];
}

/**
 * 向收藏夹添加菜谱
 */
export function addRecipeToCollection(
  collectionId: string,
  recipeId: string
): boolean {
  console.log(`[Collections] addRecipeToCollection: collectionId=${collectionId}, recipeId=${recipeId}`);

  const data = getLocalCollectionsData();
  const index = data.collections.findIndex(c => c.id === collectionId);

  if (index === -1) {
    console.error(`[Collections] 收藏夹不存在: ${collectionId}`);
    return false;
  }

  const collection = data.collections[index];

  // 检查是否已存在
  if (!collection.recipeIds) {
    collection.recipeIds = [];
  }

  const exists = collection.recipeIds.includes(recipeId);
  if (exists) {
    console.log(`[Collections] 菜谱 ${recipeId} 已在收藏夹 ${collectionId} 中`);
    // 已存在，返回true表示操作成功（无需重复添加）
    return true;
  }

  collection.recipeIds.push(recipeId);
  collection.recipeCount = collection.recipeIds.length;
  collection.updatedAt = Date.now();
  collection.synced = false;

  // 如果收藏夹没有封面，自动使用这道菜的封面
  if (!collection.coverImage || collection.coverImage.trim() === '') {
    // 从本地 recipes.json 中查找菜品封面
    try {
      const recipes = loadRecipesJson();
      const recipe = recipes.find(r => String(r.id) === String(recipeId));
      if (recipe && recipe.coverImage) {
        collection.coverImage = String(recipe.coverImage).trim();
        console.log(`[Collections] 自动设置封面: ${collection.coverImage}`);
      }
    } catch (e) {
      console.warn('[Collections] 加载菜谱数据失败，跳过自动封面设置', e);
    }
  }

  data.collections[index] = collection;
  const saveSuccess = saveLocalCollectionsData(data);
  console.log(`[Collections] 添加成功: 收藏夹=${collectionId}, 菜谱=${recipeId}, 保存结果=${saveSuccess}, 当前数量=${collection.recipeCount}`);

  return true;
}

/**
 * 从收藏夹移除菜谱
 */
export function removeRecipeFromCollection(
  collectionId: string,
  recipeId: string
): boolean {
  console.log(`[Collections] removeRecipeFromCollection: collectionId=${collectionId}, recipeId=${recipeId}`);

  const data = getLocalCollectionsData();
  const index = data.collections.findIndex(c => c.id === collectionId);

  if (index === -1) {
    console.error(`[Collections] 收藏夹不存在: ${collectionId}`);
    return false;
  }

  const collection = data.collections[index];

  if (!collection.recipeIds) {
    console.log(`[Collections] 收藏夹 ${collectionId} 没有菜谱列表`);
    return false;
  }

  const pos = collection.recipeIds.indexOf(recipeId);
  if (pos === -1) {
    console.log(`[Collections] 菜谱 ${recipeId} 不在收藏夹 ${collectionId} 中`);
    return false;
  }

  const removed = collection.recipeIds.splice(pos, 1);

  if (removed.length > 0) {
    collection.recipeCount = collection.recipeIds.length;
    collection.updatedAt = Date.now();
    collection.synced = false;
    data.collections[index] = collection;
    const saveSuccess = saveLocalCollectionsData(data);
    console.log(`[Collections] 移除成功: 收藏夹=${collectionId}, 菜谱=${recipeId}, 保存结果=${saveSuccess}, 当前数量=${collection.recipeCount}`);
    return true;
  }

  return false;
}

/**
 * 检查菜谱是否在收藏夹中
 */
export function isRecipeInCollection(collectionId: string, recipeId: string): boolean {
  const collection = getCollectionById(collectionId);
  if (!collection || !collection.recipeIds) {
    return false;
  }
  return collection.recipeIds.includes(recipeId);
}

/**
 * 检查菜谱是否在任何收藏夹中
 */
export function isRecipeFavoritedAnywhere(recipeId: string): boolean {
  console.log(`[Collections] isRecipeFavoritedAnywhere: recipeId=${recipeId}`);
  const collections = getCollections();
  const result = collections.some(c => c.recipeIds && c.recipeIds.includes(recipeId));
  console.log(`[Collections] 收藏夹列表: ${collections.map(c => ({id: c.id, name: c.name, count: c.recipeCount})).join(', ')}`);
  console.log(`[Collections] isRecipeFavoritedAnywhere 结果: ${result}`);
  return result;
}

/**
 * 获取收藏夹中菜谱数量
 */
export function getCollectionRecipeCount(collectionId: string): number {
  const collection = getCollectionById(collectionId);
  return collection ? collection.recipeCount : 0;
}

/**
 * 切换菜谱在收藏夹中的状态（添加/移除）
 * @returns { success: boolean; added?: boolean; collectionName?: string }
 */
export function toggleRecipeInCollection(recipeId: string, collectionId: string): {
  success: boolean;
  added?: boolean;
  collectionName?: string;
} {
  const collection = getCollectionById(collectionId);
  if (!collection) {
    return { success: false };
  }

  const isIn = isRecipeInCollection(collectionId, recipeId);

  if (isIn) {
    // 移除
    removeRecipeFromCollection(collectionId, recipeId);
    return { success: true, added: false, collectionName: collection.name };
  } else {
    // 添加
    const added = addRecipeToCollection(collectionId, recipeId);
    if (added) {
      return { success: true, added: true, collectionName: collection.name };
    }
    return { success: false };
  }
}
export function getActiveCollection(): Collection | null {
  const activeId = getActiveCollectionId();
  if (!activeId) {
    return getDefaultCollection();
  }
  return getCollectionById(activeId) || getDefaultCollection();
}

/**
 * 设置当前活跃收藏夹
 */
export function setActiveCollection(collectionId: string): boolean {
  const collection = getCollectionById(collectionId);
  if (!collection) {
    return false;
  }
  setActiveCollectionId(collectionId);
  return true;
}

/**
 * 初始化默认收藏夹（如果用户还没有任何收藏夹）
 * 返回：是否新建了默认收藏夹
 */
export function ensureDefaultCollection(): boolean {
  const collections = getCollections();
  if (collections.length > 0) {
    return false; // 已有收藏夹，无需创建
  }

  const now = Date.now();
  const defaultCollection: Collection = {
    id: generateId(),
    userId: '',
    name: DEFAULT_COLLECTION_NAME + '1',
    coverImage: '',
    description: '我的第一个收藏夹',
    recipeCount: 0,
    isDefault: true,
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
    recipeIds: [],
    synced: false
  };

  const data = getLocalCollectionsData();
  data.collections.push(defaultCollection);
  saveLocalCollectionsData(data);
  setActiveCollectionId(defaultCollection.id);

  return true;
}

/**
 * 标记数据需要同步
 */
export function markCollectionsDirty(): void {
  const data = getLocalCollectionsData();
  data.collections.forEach(col => {
    col.synced = false;
  });
  saveLocalCollectionsData(data);
}

/**
 * 标记特定收藏夹已同步
 */
export function markCollectionSynced(collectionId: string): void {
  const data = getLocalCollectionsData();
  const col = data.collections.find(c => c.id === collectionId);
  if (col) {
    col.synced = true;
    col.updatedAt = Date.now();
    saveLocalCollectionsData(data);
  }
}

/**
 * 标记所有数据已同步
 */
export function markAllCollectionsSynced(): void {
  const data = getLocalCollectionsData();
  data.collections.forEach(col => {
    col.synced = true;
  });
  data.lastSyncTime = Date.now();
  saveLocalCollectionsData(data);
}

/**
 * 获取未同步的收藏夹
 */
export function getUnsyncedCollections(): Collection[] {
  const data = getLocalCollectionsData();
  return data.collections.filter(c => !c.synced);
}

/**
 * 获取收藏夹统计信息
 */
export function getCollectionStats(): {
  total: number;
  totalRecipes: number;
  defaultCollectionId: string;
} {
  const collections = getCollections();
  const totalRecipes = collections.reduce((sum, c) => sum + c.recipeCount, 0);
  const defaultCol = getDefaultCollection();

  return {
    total: collections.length,
    totalRecipes,
    defaultCollectionId: defaultCol ? defaultCol.id : ''
  };
}

/**
 * 清空所有本地收藏夹数据（慎用）
 */
export function clearAllCollections(): void {
  try {
    wx.removeStorageSync(STORAGE_KEY);
    wx.removeStorageSync(ACTIVE_COLLECTION_KEY);
  } catch (e) {
    console.error('[Collections] 清空数据失败', e);
  }
}

/**
 * 获取包含某菜谱的所有收藏夹
 */
export function getCollectionsContainingRecipe(recipeId: string): Collection[] {
  console.log(`[Collections] getCollectionsContainingRecipe: recipeId=${recipeId}`);
  const collections = getCollections();
  const result = collections.filter(c => c.recipeIds && c.recipeIds.includes(recipeId));
  console.log(`[Collections] 找到 ${result.length} 个收藏夹包含该菜谱`);
  return result;
}

/**
 * 检查菜谱是否在任何收藏夹中（别名）
 */
export function isRecipeInAnyCollection(recipeId: string): boolean {
  return isRecipeFavoritedAnywhere(recipeId);
}
