/**
 * 冰箱食材本地存储管理
 * 食材数据存储在 localStorage，无网络依赖
 */

export interface FridgeItem {
  id: string;
  name: string;
  /** 计量单位 */
  unit?: string;
  /** 数量 */
  count?: number;
  /** 过期时间（时间戳，ms） */
  expireAt?: number;
  /** 添加时间 */
  addedAt: number;
  /** 分类 */
  category?: string;
  /** 是否已过期 */
  expired?: boolean;
}

const FRIDGE_KEY = 'fridge_items';

/** 获取冰箱食材列表 */
export function getFridgeItems(): FridgeItem[] {
  try {
    const raw = wx.getStorageSync(FRIDGE_KEY);
    const items: FridgeItem[] = raw ? JSON.parse(raw) : [];
    const now = Date.now();
    return items.map(item => ({
      ...item,
      expired: item.expireAt ? item.expireAt < now : false,
    }));
  } catch {
    return [];
  }
}

/** 保存冰箱食材列表 */
function saveFridgeItems(items: FridgeItem[]): void {
  wx.setStorageSync(FRIDGE_KEY, JSON.stringify(items));
}

/** 添加单个食材 */
export function addToFridge(name: string, unit?: string, count?: number, expireAt?: number, category?: string): FridgeItem {
  const items = getFridgeItems();
  // 检查是否已存在同名食材
  const existing = items.findIndex(i => i.name === name);
  const newItem: FridgeItem = {
    id: existing >= 0 ? items[existing].id : 'fridge_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    name,
    unit,
    count,
    expireAt,
    category,
    addedAt: Date.now(),
  };

  if (existing >= 0) {
    items[existing] = newItem;
  } else {
    items.push(newItem);
  }

  saveFridgeItems(items);
  return newItem;
}

/** 批量添加食材 */
export function addMultipleToFridge(items: Array<{ name: string; unit?: string; count?: number; expireAt?: number; category?: string }>): void {
  const current = getFridgeItems();
  const now = Date.now();

  for (const item of items) {
    const idx = current.findIndex(i => i.name === item.name);
    const newItem: FridgeItem = {
      id: idx >= 0 ? current[idx].id : 'fridge_' + now + '_' + Math.random().toString(36).slice(2, 7),
      name: item.name,
      unit: item.unit,
      count: item.count,
      expireAt: item.expireAt,
      category: item.category,
      addedAt: now,
    };

    if (idx >= 0) {
      current[idx] = newItem;
    } else {
      current.push(newItem);
    }
  }

  saveFridgeItems(current);
}

/** 移除食材 */
export function removeFromFridge(id: string): void {
  const items = getFridgeItems().filter(i => i.id !== id);
  saveFridgeItems(items);
}

/** 更新单个食材 */
export function updateFridgeItem(id: string, updates: Partial<Omit<FridgeItem, 'id' | 'addedAt'>>): void {
  const items = getFridgeItems();
  const idx = items.findIndex(i => i.id === id);
  if (idx >= 0) {
    items[idx] = { ...items[idx], ...updates };
    saveFridgeItems(items);
  }
}

/** 清空冰箱 */
export function clearFridge(): void {
  wx.removeStorageSync(FRIDGE_KEY);
}

/** 获取已过期食材 */
export function getExpiredItems(): FridgeItem[] {
  return getFridgeItems().filter(i => i.expired);
}

/** 按分类分组 */
export function getFridgeItemsByCategory(): Record<string, FridgeItem[]> {
  const items = getFridgeItems();
  const groups: Record<string, FridgeItem[]> = {};
  for (const item of items) {
    const cat = item.category || '未分类';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  }
  return groups;
}
