/**
 * 云数据库服务
 * 支持从云端加载菜谱和食材数据，并进行本地缓存
 * 环境 ID: cloud1-3gyq7jzx76f46edc
 */

import { Recipe } from '../types/index';

// 云数据库集合名称
const RECIPES_COLLECTION = 'recipes';
const INGREDIENTS_COLLECTION = 'ingredients';

// 缓存配置
const CACHE_KEY_RECIPES = 'cloud_recipes_cache';
const CACHE_KEY_RECIPES_META = 'cloud_recipes_cache_meta';
const CACHE_KEY_INGREDIENTS = 'cloud_ingredients_cache';
const CACHE_KEY_INGREDIENTS_META = 'cloud_ingredients_cache_meta';
const CACHE_EXPIRE_HOURS = 24; // 缓存24小时

// ============ 全局单例缓存 ============
// 整个小程序生命周期内，只从云端/本地加载一次菜谱数据
// 所有页面共享这份缓存，不再重复加载
let _globalRecipes: Recipe[] | null = null;
let _globalRecipesPromise: Promise<Recipe[]> | null = null;
let _globalRecipesLoaded = false;
let _globalRecipesLoading = false;

// 食材全局缓存
let _globalIngredients: Array<{ name: string; category: string; subCategory?: string }> | null = null;
let _globalIngredientsPromise: Promise<Array<{ name: string; category: string; subCategory?: string }>> | null = null;

interface CacheMeta {
  updateTime: number;
  count: number;
}

/**
 * 检查云开发是否可用
 */
function isCloudAvailable(): boolean {
  try {
    return !!(wx.cloud && typeof wx.cloud.init === 'function');
  } catch (e) {
    return false;
  }
}

/**
 * 获取缓存元信息
 */
function getCacheMeta(key: string): CacheMeta | null {
  try {
    const meta = wx.getStorageSync(key);
    return meta ? JSON.parse(meta) : null;
  } catch (e) {
    return null;
  }
}

/**
 * 设置缓存元信息
 */
function setCacheMeta(key: string, meta: CacheMeta): void {
  try {
    wx.setStorageSync(key, JSON.stringify(meta));
  } catch (e) {
    console.warn('[CloudService] 设置缓存元信息失败', e);
  }
}

/**
 * 检查缓存是否过期
 */
function isCacheExpired(meta: CacheMeta | null): boolean {
  if (!meta) return true;
  const now = Date.now();
  const expireMs = CACHE_EXPIRE_HOURS * 60 * 60 * 1000;
  return now - meta.updateTime > expireMs;
}

/**
 * 从本地缓存加载菜谱
 */
export function getLocalCachedRecipes(): Recipe[] | null {
  try {
    const meta = getCacheMeta(CACHE_KEY_RECIPES_META);
    if (isCacheExpired(meta)) {
      wx.removeStorageSync(CACHE_KEY_RECIPES);
      wx.removeStorageSync(CACHE_KEY_RECIPES_META);
      return null;
    }
    const data = wx.getStorageSync(CACHE_KEY_RECIPES);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn('[CloudService] 读取本地菜谱缓存失败', e);
  }
  return null;
}

/**
 * 保存菜谱到本地缓存
 */
export function saveLocalCachedRecipes(recipes: Recipe[]): void {
  try {
    wx.setStorageSync(CACHE_KEY_RECIPES, JSON.stringify(recipes));
    setCacheMeta(CACHE_KEY_RECIPES_META, {
      updateTime: Date.now(),
      count: recipes.length
    });
  } catch (e) {
    console.warn('[CloudService] 保存菜谱缓存失败', e);
  }
}

/**
 * 获取全局单例菜谱数据（核心函数）
 * 首次调用触发加载，后续调用直接返回已加载的数据
 * @param localFallback 本地 JSON 文件兜底加载函数
 * @returns 菜谱数组
 */
export function getGlobalRecipes(localFallback: () => Recipe[]): Recipe[] | null {
  // 如果已有数据，直接返回（同步）
  if (_globalRecipesLoaded && _globalRecipes !== null) {
    return _globalRecipes;
  }
  // 同步路径：直接尝试 Storage 缓存（快速）
  const cached = getLocalCachedRecipes();
  if (cached && cached.length > 0) {
    _globalRecipes = cached;
    _globalRecipesLoaded = true;
    console.log(`[CloudService] 从 Storage 缓存恢复 ${cached.length} 条菜谱`);
    return _globalRecipes;
  }
  // 同步路径兜底：本地 JSON
  const local = localFallback();
  if (local && local.length > 0) {
    _globalRecipes = local;
    _globalRecipesLoaded = true;
    console.log(`[CloudService] 从本地 JSON 加载 ${local.length} 条菜谱`);
    return _globalRecipes;
  }
  return null;
}

/**
 * 异步获取全局单例菜谱（推荐用于页面 onLoad）
 * 始终返回 Promise，首次调用触发加载，后续调用等待同一加载结果
 * @param localFallback 本地 JSON 文件兜底加载函数
 */
export function getGlobalRecipesAsync(localFallback: () => Recipe[]): Promise<Recipe[]> {
  // 如果已经在加载中，返回同一 Promise
  if (_globalRecipesPromise) {
    return _globalRecipesPromise;
  }
  // 如果已有数据，直接返回
  if (_globalRecipesLoaded && _globalRecipes !== null) {
    return Promise.resolve(_globalRecipes);
  }

  // 同步缓存优先
  const cached = getLocalCachedRecipes();
  if (cached && cached.length > 0) {
    _globalRecipes = cached;
    _globalRecipesLoaded = true;
    console.log(`[CloudService] 从 Storage 缓存恢复 ${cached.length} 条菜谱`);
    return Promise.resolve(_globalRecipes);
  }

  // 开始加载
  _globalRecipesLoading = true;
  _globalRecipesPromise = loadRecipesFromCloud()
    .then(cloudRecipes => {
      if (cloudRecipes && cloudRecipes.length > 0) {
        saveLocalCachedRecipes(cloudRecipes);
        _globalRecipes = cloudRecipes;
        _globalRecipesLoaded = true;
        console.log(`[CloudService] 从云端加载 ${cloudRecipes.length} 条菜谱`);
        return cloudRecipes;
      }
      // 云端无数据，尝试本地
      const local = localFallback();
      if (local && local.length > 0) {
        saveLocalCachedRecipes(local);
        _globalRecipes = local;
        _globalRecipesLoaded = true;
        console.log(`[CloudService] 降级本地 JSON ${local.length} 条菜谱`);
        return local;
      }
      // 兜底数据
      const fallback = localFallback();
      _globalRecipes = fallback;
      _globalRecipesLoaded = true;
      return fallback;
    })
    .finally(() => {
      _globalRecipesLoading = false;
      _globalRecipesPromise = null;
    });

  return _globalRecipesPromise;
}

/**
 * 预填充全局缓存（在 App 启动时调用）
 * 与 getGlobalRecipesAsync 的区别：此函数不返回 Promise，后台静默执行
 * @param localFallback 本地 JSON 文件兜底加载函数
 */
export function preloadGlobalRecipes(localFallback: () => Recipe[]): void {
  // 已经有数据，无需重复加载
  if (_globalRecipesLoaded && _globalRecipes !== null) {
    console.log('[CloudService] 全局菜谱已就绪，无需重复预加载');
    return;
  }
  // 已经在加载中，跳过
  if (_globalRecipesLoading) {
    console.log('[CloudService] 正在预加载中，跳过重复调用');
    return;
  }
  // 启动异步预加载（不阻塞）
  getGlobalRecipesAsync(localFallback);
}

/**
 * 从本地缓存加载食材
 */
export function getLocalCachedIngredients(): Array<{
  name: string;
  category: string;
  subCategory?: string;
}> | null {
  try {
    const meta = getCacheMeta(CACHE_KEY_INGREDIENTS_META);
    if (isCacheExpired(meta)) {
      wx.removeStorageSync(CACHE_KEY_INGREDIENTS);
      wx.removeStorageSync(CACHE_KEY_INGREDIENTS_META);
      return null;
    }
    const data = wx.getStorageSync(CACHE_KEY_INGREDIENTS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn('[CloudService] 读取本地食材缓存失败', e);
  }
  return null;
}

/**
 * 保存食材到本地缓存
 */
export function saveLocalCachedIngredients(ingredients: Array<{
  name: string;
  category: string;
  subCategory?: string;
}>): void {
  try {
    wx.setStorageSync(CACHE_KEY_INGREDIENTS, JSON.stringify(ingredients));
    setCacheMeta(CACHE_KEY_INGREDIENTS_META, {
      updateTime: Date.now(),
      count: ingredients.length
    });
  } catch (e) {
    console.warn('[CloudService] 保存食材缓存失败', e);
  }
}

/**
 * 从云数据库加载所有菜谱
 * @returns 菜谱数组，失败返回 null
 */
export async function loadRecipesFromCloud(): Promise<Recipe[] | null> {
  if (!isCloudAvailable()) {
    console.warn('[CloudService] 云开发不可用');
    return null;
  }

  try {
    const db = wx.cloud.database();
    const DEFAULT_LIMIT = 20;  // 云数据库默认每次最多返回20条
    const batchSize = 20;      // 每批获取数量
    let totalRecipes: any[] = [];
    let skip = 0;
    let consecutiveEmpty = 0;
    const maxEmptyBatches = 3; // 连续3次空结果则停止
    const maxTotalRecords = 2000; // 最多获取2000条

    console.log('[CloudService] 开始从云端加载菜谱...');
    
    // 分批获取所有数据
    while (consecutiveEmpty < maxEmptyBatches && totalRecipes.length < maxTotalRecords) {
      const result = await db.collection(RECIPES_COLLECTION)
        .skip(skip)
        .limit(batchSize)
        .get();

      const count = (result.data && result.data.length) || 0;
      
      if (count > 0) {
        totalRecipes = totalRecipes.concat(result.data);
        skip += count;
        consecutiveEmpty = 0;
        
        if (totalRecipes.length % 100 === 0) {
          console.log(`[CloudService] 已获取 ${totalRecipes.length} 条...`);
        }
        
        // 如果返回的数量少于请求的数量，说明数据已经取完
        if (count < batchSize) {
          console.log(`[CloudService] 数据已取完，共 ${totalRecipes.length} 条`);
          break;
        }
      } else {
        consecutiveEmpty++;
        console.log(`[CloudService] 第 ${consecutiveEmpty} 次返回空数据...`);
      }
    }

    console.log(`[CloudService] 从云端加载了 ${totalRecipes.length} 条菜谱`);
    return totalRecipes as Recipe[];
  } catch (e) {
    console.error('[CloudService] 从云端加载菜谱失败', e);
    return null;
  }
}

/**
 * 从云数据库加载所有食材
 * @returns 食材数组，失败返回 null
 */
export async function loadIngredientsFromCloud(): Promise<Array<{
  name: string;
  category: string;
  subCategory?: string;
}> | null> {
  if (!isCloudAvailable()) {
    console.warn('[CloudService] 云开发不可用');
    return null;
  }

  try {
    const db = wx.cloud.database();
    const batchCount = 100;
    let totalIngredients: any[] = [];
    let skip = 0;
    let hasMore = true;
    const maxLoops = 20;

    while (hasMore && skip < maxLoops * batchCount) {
      const result = await db.collection(INGREDIENTS_COLLECTION)
        .skip(skip)
        .limit(batchCount)
        .get();

      if (result.data && result.data.length > 0) {
        totalIngredients = totalIngredients.concat(result.data);
        skip += result.data.length;
        hasMore = result.data.length === batchCount;
      } else {
        hasMore = false;
      }
    }

    console.log(`[CloudService] 从云端加载了 ${totalIngredients.length} 条食材`);
    return totalIngredients;
  } catch (e) {
    console.error('[CloudService] 从云端加载食材失败', e);
    return null;
  }
}

/**
 * 加载菜谱（云端优先，本地兜底）
 * @param fallbackLoader 本地文件加载函数
 * @returns 菜谱数组
 */
export async function loadRecipesWithCloudFallback(
  fallbackLoader: () => Recipe[]
): Promise<Recipe[]> {
  // 1. 尝试从云端加载（云端优先，确保获取最新数据）
  try {
    const cloudRecipes = await loadRecipesFromCloud();
    if (cloudRecipes && cloudRecipes.length > 0) {
      console.log(`[CloudService] 云端加载成功，共 ${cloudRecipes.length} 条菜谱`);
      // 保存到本地缓存
      saveLocalCachedRecipes(cloudRecipes);
      return cloudRecipes;
    }
  } catch (e) {
    console.warn('[CloudService] 云端加载失败，使用本地文件', e);
  }

  // 2. 本地缓存兜底
  const localCache = getLocalCachedRecipes();
  if (localCache && localCache.length > 0) {
    console.log(`[CloudService] 使用本地缓存菜谱 ${localCache.length} 条`);
    return localCache;
  }

  // 3. 本地 JSON 文件兜底
  const localRecipes = fallbackLoader();
  if (localRecipes && localRecipes.length > 0) {
    console.log(`[CloudService] 使用本地 JSON 文件 ${localRecipes.length} 条菜谱`);
    saveLocalCachedRecipes(localRecipes);
    return localRecipes;
  }

  return [];
}

/**
 * 加载食材（直接使用本地文件）
 * @param fallbackLoader 本地文件加载函数
 * @returns 食材数组
 */
export async function loadIngredientsWithCloudFallback(
  fallbackLoader: () => Array<{ name: string; category: string; subCategory?: string }>
): Promise<Array<{ name: string; category: string; subCategory?: string }>> {
  // 直接使用本地 JSON 文件
  const localIngredients = fallbackLoader();
  if (localIngredients && localIngredients.length > 0) {
    console.log(`[CloudService] 使用本地 JSON 文件 ${localIngredients.length} 条食材`);
    saveLocalCachedIngredients(localIngredients);
    return localIngredients;
  }

  return [];
}

/**
 * 获取单个菜谱详情（从云端）
 */
export async function getRecipeByIdFromCloud(id: string): Promise<Recipe | null> {
  if (!isCloudAvailable()) {
    return null;
  }

  try {
    const db = wx.cloud.database();
    const result = await db.collection(RECIPES_COLLECTION)
      .where({ id: String(id) })
      .limit(1)
      .get();

    if (result.data && result.data.length > 0) {
      return result.data[0] as Recipe;
    }
    return null;
  } catch (e) {
    console.error('[CloudService] 获取菜谱详情失败', e);
    return null;
  }
}

/**
 * 按菜名获取菜谱详情（从云端）
 * @param name 菜谱名称
 */
export async function getRecipeByNameFromCloud(name: string): Promise<Recipe | null> {
  if (!isCloudAvailable() || !name) {
    return null;
  }

  try {
    const db = wx.cloud.database();
    const result = await db.collection(RECIPES_COLLECTION)
      .where({ name: name })
      .limit(1)
      .get();

    if (result.data && result.data.length > 0) {
      console.log(`[CloudService] 按菜名 "${name}" 找到菜谱:`, result.data[0].name);
      return result.data[0] as Recipe;
    }
    console.log(`[CloudService] 按菜名 "${name}" 未找到匹配`);
    return null;
  } catch (e) {
    console.error('[CloudService] 按菜名查询失败', e);
    return null;
  }
}

/**
 * 批量按菜名查询菜谱（从云端）
 * @param names 菜名数组
 * @returns 找到的菜谱数组
 */
export async function getRecipesByNamesFromCloud(names: string[]): Promise<Recipe[]> {
  if (!isCloudAvailable() || !names || names.length === 0) {
    return [];
  }

  const results: Recipe[] = [];
  
  // 分批查询，每批最多20个名字（云数据库限制）
  const batchSize = 20;
  
  for (let i = 0; i < names.length; i += batchSize) {
    const batch = names.slice(i, i + batchSize);
    
    try {
      const db = wx.cloud.database();
      const result = await db.collection(RECIPES_COLLECTION)
        .where({
          name: db.command.in(batch)
        })
        .limit(batchSize)
        .get();

      if (result.data && result.data.length > 0) {
        results.push(...(result.data as Recipe[]));
        console.log(`[CloudService] 批量查询菜名 ${i}-${i + batch.length}，找到 ${result.data.length} 条`);
      }
    } catch (e) {
      console.error(`[CloudService] 批量查询菜名失败 (${i}-${i + batch.length})`, e);
    }
  }

  return results;
}

/**
 * 搜索菜谱（从云端）
 */
export async function searchRecipesFromCloud(keyword: string): Promise<Recipe[]> {
  if (!isCloudAvailable() || !keyword) {
    return [];
  }

  try {
    const db = wx.cloud.database();
    const result = await db.collection(RECIPES_COLLECTION)
      .where({
        name: db.RegExp({
          regexp: keyword,
          options: 'i'
        })
      })
      .limit(50)
      .get();

    return result.data as Recipe[];
  } catch (e) {
    console.error('[CloudService] 搜索菜谱失败', e);
    return [];
  }
}

/**
 * 清除所有云端缓存
 */
export function clearAllCloudCache(): void {
  try {
    wx.removeStorageSync(CACHE_KEY_RECIPES);
    wx.removeStorageSync(CACHE_KEY_RECIPES_META);
    wx.removeStorageSync(CACHE_KEY_INGREDIENTS);
    wx.removeStorageSync(CACHE_KEY_INGREDIENTS_META);
    console.log('[CloudService] 已清除所有云端缓存');
  } catch (e) {
    console.warn('[CloudService] 清除缓存失败', e);
  }
}

/**
 * 缓存优先的异步加载菜谱（立即返回缓存，后台更新）
 * @param fallbackLoader 本地文件加载函数
 * @param onUpdate 可选：云端数据更新时的回调
 */
export async function loadRecipesCacheFirst(
  fallbackLoader: () => Recipe[],
  onUpdate?: (recipes: Recipe[]) => void
): Promise<Recipe[]> {
  // 1. 立即返回本地缓存（快速响应）
  const localCache = getLocalCachedRecipes();
  if (localCache && localCache.length > 0) {
    console.log(`[CloudService] 缓存优先返回 ${localCache.length} 条菜谱`);
    // 后台静默加载云端更新
    loadRecipesFromCloud().then(cloudRecipes => {
      if (cloudRecipes && cloudRecipes.length > 0) {
        saveLocalCachedRecipes(cloudRecipes);
        if (onUpdate) {
          onUpdate(cloudRecipes);
        }
      }
    }).catch(() => {});
    return localCache;
  }

  // 2. 没有缓存，尝试云端
  try {
    const cloudRecipes = await loadRecipesFromCloud();
    if (cloudRecipes && cloudRecipes.length > 0) {
      saveLocalCachedRecipes(cloudRecipes);
      return cloudRecipes;
    }
  } catch (e) {
    console.warn('[CloudService] 云端加载失败', e);
  }

  // 3. 使用本地 JSON 兜底
  const localRecipes = fallbackLoader();
  if (localRecipes && localRecipes.length > 0) {
    saveLocalCachedRecipes(localRecipes);
  }
  return localRecipes;
}

// 预加载状态管理（防止重复加载）
let _isPreloading = false;
let _preloadPromise: Promise<void> | null = null;

/**
 * 后台预加载云端菜谱数据
 * 调用后会在后台静默加载数据并缓存，其他页面可直接从缓存读取
 * 建议在 App.onLaunch 中调用
 */
export function preloadCloudRecipes(): Promise<void> {
  // 如果已经在加载中，返回现有 Promise
  if (_preloadPromise) {
    return _preloadPromise;
  }

  // 如果已经有有效缓存，后台静默刷新
  const cached = getLocalCachedRecipes();
  if (cached && cached.length > 0) {
    console.log('[CloudService] 已有缓存，后台静默刷新云端数据...');
    _preloadPromise = loadRecipesFromCloud()
      .then(cloudRecipes => {
        if (cloudRecipes && cloudRecipes.length > 0) {
          saveLocalCachedRecipes(cloudRecipes);
          console.log(`[CloudService] 后台刷新完成，共 ${cloudRecipes.length} 条菜谱`);
        }
      })
      .catch(e => {
        console.warn('[CloudService] 后台刷新失败', e);
      })
      .finally(() => {
        _isPreloading = false;
        _preloadPromise = null;
      });
    return _preloadPromise;
  }

  // 没有缓存，立即从云端加载
  console.log('[CloudService] 开始预加载云端菜谱...');
  _isPreloading = true;
  _preloadPromise = loadRecipesFromCloud()
    .then(cloudRecipes => {
      if (cloudRecipes && cloudRecipes.length > 0) {
        saveLocalCachedRecipes(cloudRecipes);
        console.log(`[CloudService] 预加载完成，共 ${cloudRecipes.length} 条菜谱`);
      }
    })
    .catch(e => {
      console.warn('[CloudService] 预加载失败', e);
    })
    .finally(() => {
      _isPreloading = false;
      _preloadPromise = null;
    });
  return _preloadPromise;
}

/**
 * 检查预加载是否完成
 */
export function isPreloadComplete(): boolean {
  const cached = getLocalCachedRecipes();
  return cached !== null && cached.length > 0;
}

/**
 * 获取预加载状态
 */
export function isPreloading(): boolean {
  return _isPreloading;
}
