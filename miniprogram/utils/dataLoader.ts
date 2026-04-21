// 统一的数据加载工具
// 支持云端加载 + 本地缓存 + 本地JSON文件兜底

import { Recipe } from '../types/index';
import { normalizeRecipesFromRaw } from './recipeUtils';
import { getCachedRecipe, cacheRecipe, cacheRecipes, getCachedRecipeIdList, cacheRecipeIdList, preCacheRecipes } from './recipeCache';
import {
  loadRecipesWithCloudFallback,
  loadIngredientsWithCloudFallback,
  getLocalCachedRecipes,
  getLocalCachedIngredients,
  loadRecipesCacheFirst,
  getGlobalRecipes,
  getGlobalRecipesAsync,
  preloadGlobalRecipes,
} from './cloudService';

/**
 * 预填充全局缓存（在 App 启动时调用，后台静默执行）
 * @param localFallback 本地 JSON 文件兜底加载函数
 */
export { preloadGlobalRecipes } from './cloudService';

/**
 * 从多个候选路径中尝试读取JSON文件
 * @param candidates 候选路径数组
 * @returns JSON文件内容字符串，如果都失败则返回null
 */
export function loadJsonFile(candidates: string[]): string | null {
  const fsm =
    typeof wx !== 'undefined' && wx.getFileSystemManager
      ? wx.getFileSystemManager()
      : null;
  if (!fsm || !fsm.readFileSync) {
    return null;
  }

  for (const p of candidates) {
    try {
      const res = fsm.readFileSync(p, 'utf8') as unknown;
      if (typeof res === 'string' && res.trim()) {
        return res;
      }
    } catch (_e) {
      // 继续尝试下一个路径
    }
  }
  return null;
}

/**
 * 加载轻量级菜谱列表（仅 id、name、coverImage 等基本信息）
 * 用于列表页快速加载，不包含完整详情
 */
export function loadRecipeListJson(): Array<{
  id: string;
  name: string;
  coverImage: string;
  mealTimes: string[];
  dishTypes: string[];
  timeCost: number;
  difficulty: string;
}> {
  const candidates = [
    'data/recipes-split/list.json',
    '/data/recipes-split/list.json',
    '/miniprogram/data/recipes-split/list.json'
  ];

  const jsonText = loadJsonFile(candidates);
  if (!jsonText) {
    return [];
  }

  try {
    return JSON.parse(jsonText);
  } catch (e) {
    console.error('解析轻量菜谱列表失败', e);
    return [];
  }
}

/**
 * 加载单个分类的菜谱分片
 * @param fileName 分片文件名
 */
export function loadRecipeChunk(fileName: string): Recipe[] {
  const candidates = [
    `data/recipes-split/${fileName}`,
    `/data/recipes-split/${fileName}`,
    `/miniprogram/data/recipes-split/${fileName}`
  ];

  const jsonText = loadJsonFile(candidates);
  if (!jsonText) {
    return [];
  }

  try {
    return JSON.parse(jsonText);
  } catch (e) {
    console.error(`加载菜谱分片失败: ${fileName}`, e);
    return [];
  }
}

/**
 * 根据 ID 获取单个菜谱详情（优先从缓存读取）
 * @param id 菜谱 ID
 * @param onMiss 可选：缓存未命中时的回调，传入完整列表用于查找
 */
export function getRecipeById(id: string, fullList?: Recipe[]): Recipe | null {
  // 1. 先从缓存读取
  const cached = getCachedRecipe(id);
  if (cached) {
    return cached;
  }

  // 2. 如果传入了完整列表，从中查找
  if (fullList && fullList.length > 0) {
    const found = fullList.find(r => String(r.id) === id);
    if (found) {
      // 存入缓存
      cacheRecipe(found);
      return found;
    }
  }

  return null;
}

/**
 * 批量获取菜谱（用于详情页相关推荐等场景）
 * @param ids 菜谱 ID 数组
 * @param fullList 完整菜谱列表（用于查找未缓存的菜谱）
 */
export function getRecipesByIds(ids: string[], fullList?: Recipe[]): Recipe[] {
  const results: Recipe[] = [];
  const missedIds: string[] = [];

  for (const id of ids) {
    const recipe = getRecipeById(id, fullList);
    if (recipe) {
      results.push(recipe);
    } else {
      missedIds.push(id);
    }
  }

  // 如果有未命中的，且有完整列表，从完整列表中补充
  if (missedIds.length > 0 && fullList) {
    const missedRecipes = fullList.filter(r => missedIds.includes(String(r.id)));
    if (missedRecipes.length > 0) {
      // 批量缓存这些菜谱
      cacheRecipes(missedRecipes);
      results.push(...missedRecipes);
    }
  }

  return results;
}

/**
 * 预缓存指定分类的菜谱（后台执行，不阻塞）
 * @param mealTimes 用餐时段筛选
 * @param dishTypes 菜品类型筛选
 * @param fullList 完整菜谱列表
 */
export function preCacheByFilter(mealTimes: string[], dishTypes: string[], fullList: Recipe[]): void {
  const filtered = fullList.filter(r => {
    const recipeMealTimes = r.mealTimes || [];
    const recipeDishTypes = r.dishTypes || [];
    const matchMeal = mealTimes.length === 0 || recipeMealTimes.some(t => mealTimes.indexOf(t) !== -1);
    const matchDish = dishTypes.length === 0 || recipeDishTypes.some(t => dishTypes.indexOf(t) !== -1);
    return matchMeal && matchDish;
  });

  // 只预缓存前20条（避免过多内存占用）
  preCacheRecipes(filtered.slice(0, 20));
}

/**
 * 加载菜谱JSON文件（已标准化）
 * 统一数据源：require 编译时打包 → Storage 缓存 → 本地 JSON 文件
 * @returns 标准化后的菜谱数组
 */
export function loadRecipesJson(): Recipe[] {
  // 0. 优先使用编译时 require（最快，同步返回）
  // 但如果数据量太少（可能是打包不完整），跳过，使用文件系统读取
  try {
    const raw = require('../data/recipes.json') as any;
    const rawList: any[] = Array.isArray(raw)
      ? raw
      : Array.isArray(raw && raw.recipes)
      ? raw.recipes
      : [];
    // 如果数据量充足（本地完整数据应超过100条），使用编译时打包的数据
    if (rawList.length > 100) {
      return normalizeRecipesFromRaw(rawList);
    }
    console.log('[DataLoader] require 数据量不足(' + rawList.length + ')，改用文件系统读取');
  } catch (_e) {
    console.log('[DataLoader] require 失败，使用文件系统读取');
  }

  // 1. 全局单例缓存
  const global = getGlobalRecipes(() => []);
  if (global && global.length > 0) {
    return global;
  }
  // 2. Storage 缓存
  const cached = getLocalCachedRecipes();
  if (cached && cached.length > 0) {
    console.log(`[DataLoader] 使用本地缓存 ${cached.length} 条菜谱`);
    return cached;
  }
  // 3. 本地 JSON 文件（最可靠的兜底方式）
  const candidates = [
    'data/recipes.json',
    '/data/recipes.json',
    '/miniprogram/data/recipes.json',
    'miniprogram/data/recipes.json'
  ];
  const jsonText = loadJsonFile(candidates);
  if (jsonText) {
    try {
      const parsed = JSON.parse(jsonText) as any;
      const parsedObj = parsed || {};
      const rawList: any[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsedObj.recipes)
        ? parsedObj.recipes
        : [];
      if (rawList.length > 0) {
        console.log('[DataLoader] 从文件系统读取到', rawList.length, '条菜谱');
        return normalizeRecipesFromRaw(rawList);
      }
    } catch (e) {
      console.error('解析菜谱JSON失败', e);
    }
  }
  return [];
}

/**
 * 异步加载菜谱（云端优先，使用全局单例）
 * 首次调用触发加载，后续调用等待同一结果，实现全局只加载一次
 */
export async function loadRecipesAsync(): Promise<Recipe[]> {
  return getGlobalRecipesAsync(() => loadRecipesJson());
}

/**
 * 缓存优先的异步加载菜谱（立即返回缓存，后台更新）
 * 推荐用于列表页，可实现秒开效果
 * @param onUpdate 可选：云端数据更新时的回调
 */
export async function loadRecipesCacheFirstAsync(onUpdate?: (recipes: Recipe[]) => void): Promise<Recipe[]> {
  // 优先使用全局单例
  return getGlobalRecipesAsync(() => loadRecipesJson());
}

/**
 * 异步加载食材（本地文件）
 * 直接从本地 ingredients.json 加载数据
 */
export async function loadIngredientsAsync(): Promise<Array<{
  name: string;
  category: string;
  subCategory?: string;
}>> {
  return loadIngredientsJson();
}

/**
 * 缓存优先的异步加载食材（直接使用本地文件）
 * @param onUpdate 可选：数据更新时的回调（此版本不再使用）
 */
export async function loadIngredientsCacheFirstAsync(_onUpdate?: (ingredients: Array<{
  name: string;
  category: string;
  subCategory?: string;
}>) => void): Promise<Array<{
  name: string;
  category: string;
  subCategory?: string;
}>> {
  return loadIngredientsJson();
}

/**
 * 加载食材JSON文件
 * @returns 食材数组
 */
export function loadIngredientsJson(): Array<{
  name: string;
  category: string;
  subCategory?: string;
}> {
  // 先尝试本地缓存（同步）
  const cached = getLocalCachedIngredients();
  if (cached && cached.length > 0) {
    console.log(`[DataLoader] 使用本地缓存 ${cached.length} 条食材`);
    return cached;
  }

  const candidates = ['/data/ingredients.json', 'data/ingredients.json'];

  const jsonText = loadJsonFile(candidates);
  if (!jsonText) {
    return [];
  }

  try {
    const parsed = JSON.parse(jsonText) as any;
    const jsonData = Array.isArray(parsed) ? parsed : [];

    return jsonData;
  } catch (e) {
    console.error('解析食材JSON失败', e);
    return [];
  }
}
