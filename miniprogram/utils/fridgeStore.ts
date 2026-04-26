/**
 * 小冰箱数据存储模块
 *
 * 功能：
 * 1. 冰箱食材管理（添加/删除/编辑）
 * 2. 拍照添加食材
 * 3. 与小菜篮联动（去重已有食材）
 */

import { loadIngredientsJson } from './dataLoader';

export interface FridgeItem {
  /** 唯一ID */
  id: string;
  /** 食材名称 */
  name: string;
  /** 数量 */
  quantity: number;
  /** 单位 */
  unit: string;
  /** 添加时间 */
  addedAt: number;
  /** 食材分类 */
  category: string;
}

export interface FridgeData {
  openid: string;
  items: FridgeItem[];
  lastUpdated: number;
}

const STORAGE_KEY = 'littleFridge';
const STORAGE_KEY_V2 = 'littleFridgeV2';

/** 缓存食材分类映射 */
let categoryCache: Record<string, string> | null = null;

/**
 * 加载食材分类映射
 */
function loadCategoryMap(): Record<string, string> {
  if (categoryCache) return categoryCache;

  categoryCache = {};
  try {
    const ingredients = loadIngredientsJson();
    for (const ing of ingredients) {
      const name = (ing as any).name || (ing as any).title || (ing as any).ingredient || '';
      if (name) {
        categoryCache[name] = ing.category || 'other';
      }
    }
  } catch (e) {
    console.error('[Fridge] 加载食材分类失败', e);
  }
  return categoryCache;
}

/**
 * 获取食材分类
 */
export function getIngredientCategory(name: string): string {
  const categoryMap = loadCategoryMap();
  return categoryMap[name] || 'other';
}

/**
 * 规范化食材名称
 */
function normalizeIngredientName(name: string): string {
  const trimmed = name.trim();
  const aliasMap: Record<string, string> = {
    '西红柿': '番茄',
    '马铃薯': '土豆',
    '姜': '姜',
    '生姜': '姜',
    '蒜': '蒜',
    '大蒜': '蒜',
    '葱': '葱',
    '小葱': '葱',
    '大葱': '葱',
    '香葱': '葱',
  };
  return aliasMap[trimmed] || trimmed;
}

/**
 * 生成唯一ID
 */
function generateId(): string {
  return 'fridge_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
}

/**
 * 加载冰箱数据
 */
function load(): FridgeItem[] {
  try {
    // 优先读取V2版本
    const raw = wx.getStorageSync(STORAGE_KEY_V2);
    if (raw) {
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (Array.isArray(data)) return data;
    }
    // 兼容V1版本
    const rawV1 = wx.getStorageSync(STORAGE_KEY);
    if (rawV1) {
      const data = typeof rawV1 === 'string' ? JSON.parse(rawV1) : rawV1;
      if (Array.isArray(data)) {
        // 迁移到V2
        save(data as FridgeItem[]);
        return data as FridgeItem[];
      }
    }
  } catch (e) {
    console.error('[Fridge] 加载失败', e);
  }
  return [];
}

/**
 * 保存冰箱数据
 */
function save(items: FridgeItem[]): void {
  try {
    wx.setStorageSync(STORAGE_KEY_V2, JSON.stringify(items));
    // 清除旧版本
    wx.removeStorageSync(STORAGE_KEY);
  } catch (e) {
    console.error('[Fridge] 保存失败', e);
  }
}

// ============================================================
// 公开 API
// ============================================================

/**
 * 获取冰箱所有食材
 */
export function getFridgeItems(): FridgeItem[] {
  return load();
}

/**
 * 获取冰箱食材数量
 */
export function getFridgeItemCount(): number {
  return load().length;
}

/**
 * 检查食材是否在冰箱中（支持别名匹配）
 */
export function isInFridge(name: string): boolean {
  const items = load();
  const normalized = normalizeIngredientName(name);

  return items.some(item => {
    const itemNormalized = normalizeIngredientName(item.name);
    // 精确匹配
    if (itemNormalized === normalized) return true;
    // 别名匹配（扩展用户食材时已处理）
    return false;
  });
}

/**
 * 获取食材在冰箱中的信息
 */
export function getFridgeItem(name: string): FridgeItem | null {
  const items = load();
  const normalized = normalizeIngredientName(name);

  return items.find(item => {
    const itemNormalized = normalizeIngredientName(item.name);
    return itemNormalized === normalized;
  }) || null;
}

/**
 * 获取冰箱食材名称列表（用于对比）
 */
export function getFridgeIngredientNames(): string[] {
  return load().map(item => item.name);
}

/**
 * 添加食材到冰箱
 */
export function addToFridge(
  name: string,
  quantity: number = 1,
  unit: string = '个',
  category: string = 'other'
): FridgeItem[] {
  const items = load();
  const normalized = normalizeIngredientName(name);

  // 检查是否已存在
  const existingIndex = items.findIndex(item =>
    normalizeIngredientName(item.name) === normalized
  );

  if (existingIndex !== -1) {
    // 已存在，累加数量
    items[existingIndex].quantity += quantity;
    items[existingIndex].addedAt = Date.now();
  } else {
    // 新增
    items.push({
      id: generateId(),
      name: normalized,
      quantity,
      unit,
      addedAt: Date.now(),
      category
    });
  }

  save(items);
  return items;
}

/**
 * 批量添加食材到冰箱（用于拍照识别结果）
 */
export function addMultipleToFridge(
  ingredients: Array<{ name: string; quantity?: number; unit?: string; category?: string }>
): FridgeItem[] {
  let items = load();

  for (const ing of ingredients) {
    const normalized = normalizeIngredientName(ing.name);

    // 检查是否已存在
    const existingIndex = items.findIndex(item =>
      normalizeIngredientName(item.name) === normalized
    );

    if (existingIndex !== -1) {
      // 已存在，累加数量
      items[existingIndex].quantity += ing.quantity || 1;
      items[existingIndex].addedAt = Date.now();
    } else {
      // 新增
      items.push({
        id: generateId(),
        name: normalized,
        quantity: ing.quantity || 1,
        unit: ing.unit || '个',
        addedAt: Date.now(),
        category: ing.category || 'other'
      });
    }
  }

  save(items);
  return items;
}

/**
 * 从冰箱移除食材
 */
export function removeFromFridge(idOrName: string): FridgeItem[] {
  const items = load();
  const normalized = normalizeIngredientName(idOrName);

  // 支持按ID或名称删除
  const filtered = items.filter(item => {
    if (item.id === idOrName) return false;
    if (normalizeIngredientName(item.name) === normalized) return false;
    return true;
  });

  save(filtered);
  return filtered;
}

/**
 * 更新冰箱食材
 */
export function updateFridgeItem(
  id: string,
  updates: Partial<Pick<FridgeItem, 'name' | 'quantity' | 'unit' | 'category'>>
): FridgeItem[] {
  const items = load();

  for (let i = 0; i < items.length; i++) {
    if (items[i].id === id) {
      if (updates.name !== undefined) items[i].name = normalizeIngredientName(updates.name);
      if (updates.quantity !== undefined) items[i].quantity = updates.quantity;
      if (updates.unit !== undefined) items[i].unit = updates.unit;
      if (updates.category !== undefined) items[i].category = updates.category;
      break;
    }
  }

  save(items);
  return items;
}

/**
 * 清空冰箱
 */
export function clearFridge(): void {
  save([]);
}

/**
 * 从冰箱扣减食材（做菜后调用）
 */
export function consumeFromFridge(name: string, quantity: number = 1): FridgeItem[] {
  const items = load();
  const normalized = normalizeIngredientName(name);

  for (let i = 0; i < items.length; i++) {
    if (normalizeIngredientName(items[i].name) === normalized) {
      items[i].quantity = Math.max(0, items[i].quantity - quantity);
      // 数量为0时自动移除
      if (items[i].quantity <= 0) {
        items.splice(i, 1);
      }
      break;
    }
  }

  save(items);
  return items;
}

// ============================================================
// 与小菜篮联动
// ============================================================

/**
 * 获取冰箱中没有的食材（用于小菜篮去重）
 * 返回在冰箱中不存在的食材名称列表
 */
export function getMissingIngredients(ingredients: string[]): string[] {
  const fridgeNames = new Set(getFridgeIngredientNames().map(n => normalizeIngredientName(n)));
  return ingredients.filter(name => {
    const normalized = normalizeIngredientName(name);
    return !fridgeNames.has(normalized);
  });
}

/**
 * 过滤掉冰箱已有的食材（用于小菜篮显示）
 */
export function filterIngredientsInFridge(
  ingredients: Array<{ name: string; amount: string }>
): Array<{ name: string; amount: string; inFridge: boolean }> {
  const fridgeItems = load();

  return ingredients.map(ing => {
    const normalized = normalizeIngredientName(ing.name);
    const inFridge = fridgeItems.some(item =>
      normalizeIngredientName(item.name) === normalized
    );
    return {
      ...ing,
      inFridge
    };
  });
}

/**
 * 导出冰箱数据（用于数据迁移/备份）
 */
export function exportFridgeData(): FridgeData {
  return {
    openid: '', // 可扩展
    items: load(),
    lastUpdated: Date.now()
  };
}

/**
 * 导入冰箱数据（用于数据恢复）
 */
export function importFridgeData(data: FridgeData): void {
  if (Array.isArray(data.items)) {
    save(data.items);
  }
}
