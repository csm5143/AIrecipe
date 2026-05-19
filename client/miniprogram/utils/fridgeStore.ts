/**
 * 冰箱食材管理模块
 * 优先调用后端 /v1/app/fridge API，localStorage 作为离线降级
 */
import { get, post, put, del } from '../httpApi/request';
import { getWxToken } from '../httpApi/authStorage';

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

// ============ 离线本地存储（同本地模式）============

const FRIDGE_KEY = 'fridge_items';

/** 从本地缓存获取冰箱食材列表（同步，优先使用） */
function getLocalFridgeItems(): FridgeItem[] {
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

/** 保存到本地缓存 */
function saveLocalFridgeItems(items: FridgeItem[]): void {
  wx.setStorageSync(FRIDGE_KEY, JSON.stringify(items));
}

/** 同步操作：添加到本地缓存 */
function addToLocal(name: string, unit?: string, count?: number, expireAt?: number, category?: string): FridgeItem {
  const items = getLocalFridgeItems();
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
  saveLocalFridgeItems(items);
  return newItem;
}

// ============ 离线检测 ============

/** 检测网络是否可用 */
async function checkNetwork(): Promise<boolean> {
  try {
    const token = getWxToken();
    if (!token) return false;
    return true;
  } catch {
    return false;
  }
}

// ============ API 操作 ============

/** 获取冰箱食材列表（从后端，同步接口） */
export async function getFridgeItems(): Promise<FridgeItem[]> {
  try {
    const res = await get<any[]>('/app/fridge', {}, { withToken: true });
    if (res.success && res.data) {
      // 写入本地缓存
      saveLocalFridgeItems(res.data as any);
      return res.data as any;
    }
  } catch (e) {
    console.warn('[FridgeStore] 从后端获取冰箱失败，降级到本地缓存', e);
  }
  return getLocalFridgeItems();
}

/** 添加单个食材到冰箱 */
export async function addToFridge(
  name: string,
  unit?: string,
  count?: number,
  expireAt?: number,
  category?: string
): Promise<{ success: boolean; item?: FridgeItem; message: string }> {
  try {
    const res = await post<any>('/app/fridge', {
      name,
      amount: String(count || 1),
      unit,
      category,
    }, { withToken: true });

    if (res.success && res.data) {
      // 同步更新本地缓存
      const item = res.data as any;
      addToLocal(item.name, item.unit, parseFloat(item.amount) || 1, expireAt, item.category);
      return { success: true, item: res.data as any, message: '添加成功' };
    }
    // 后端失败，写入本地离线缓存
    const local = addToLocal(name, unit, count, expireAt, category);
    return { success: true, item: local, message: '已离线保存' };
  } catch (e) {
    console.warn('[FridgeStore] 添加到后端冰箱失败，使用离线模式', e);
    const local = addToLocal(name, unit, count, expireAt, category);
    return { success: true, item: local, message: '已离线保存' };
  }
}

/** 批量添加食材到冰箱 */
export async function addMultipleToFridge(
  items: Array<{ name: string; unit?: string; count?: number; expireAt?: number; category?: string }>
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await post<any[]>('/app/fridge/batch', {
      items: items.map(i => ({
        name: i.name,
        amount: String(i.count || 1),
        unit: i.unit,
        category: i.category,
      })),
    }, { withToken: true });

    if (res.success) {
      // 刷新本地缓存
      await getFridgeItems();
      return { success: true, message: '批量添加成功' };
    }
  } catch (e) {
    console.warn('[FridgeStore] 批量添加到后端冰箱失败，使用离线模式', e);
  }

  // 离线模式：逐个写入本地
  for (const item of items) {
    addToLocal(item.name, item.unit, item.count, item.expireAt, item.category);
  }
  return { success: true, message: '已离线保存' };
}

/** 移除食材 */
export async function removeFromFridge(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await del(`/app/fridge/${id}`, {}, { withToken: true });
    if (res.success) {
      // 从本地缓存中删除
      const items = getLocalFridgeItems().filter(i => i.id !== id);
      saveLocalFridgeItems(items);
      return { success: true, message: '删除成功' };
    }
  } catch (e) {
    console.warn('[FridgeStore] 从后端删除冰箱食材失败，使用离线模式', e);
  }
  const items = getLocalFridgeItems().filter(i => i.id !== id);
  saveLocalFridgeItems(items);
  return { success: true, message: '已离线删除' };
}

/** 更新食材 */
export async function updateFridgeItem(
  id: string,
  updates: Partial<Omit<FridgeItem, 'id' | 'addedAt'>>
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await put(`/app/fridge/${id}`, {
      amount: updates.count !== undefined ? String(updates.count) : undefined,
      unit: updates.unit,
      category: updates.category,
    }, { withToken: true });

    if (res.success) {
      // 更新本地缓存
      const items = getLocalFridgeItems();
      const idx = items.findIndex(i => i.id === id);
      if (idx >= 0) {
        items[idx] = { ...items[idx], ...updates };
        saveLocalFridgeItems(items);
      }
      return { success: true, message: '更新成功' };
    }
  } catch (e) {
    console.warn('[FridgeStore] 更新后端冰箱食材失败，使用离线模式', e);
  }
  // 离线模式：更新本地缓存
  const items = getLocalFridgeItems();
  const idx = items.findIndex(i => i.id === id);
  if (idx >= 0) {
    items[idx] = { ...items[idx], ...updates };
    saveLocalFridgeItems(items);
  }
  return { success: true, message: '已离线更新' };
}

/** 清空冰箱 */
export async function clearFridge(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await del('/app/fridge', {}, { withToken: true });
    if (res.success) {
      saveLocalFridgeItems([]);
      return { success: true, message: '已清空' };
    }
  } catch (e) {
    console.warn('[FridgeStore] 清空后端冰箱失败，使用离线模式', e);
  }
  saveLocalFridgeItems([]);
  return { success: true, message: '已清空' };
}

/** 获取已过期食材 */
export function getExpiredItems(): FridgeItem[] {
  return getLocalFridgeItems().filter(i => i.expired);
}

/** 按分类分组 */
export function getFridgeItemsByCategory(): Record<string, FridgeItem[]> {
  const items = getLocalFridgeItems();
  const groups: Record<string, FridgeItem[]> = {};
  for (const item of items) {
    const cat = item.category || '未分类';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  }
  return groups;
}
