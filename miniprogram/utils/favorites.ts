// 收藏功能工具（纯本地存储）
const STORAGE_KEY = 'favoriteRecipes';

/**
 * 获取收藏列表
 * @returns 收藏的菜谱ID数组
 */
export function getFavorites(): string[] {
  try {
    const favoritesJson = wx.getStorageSync(STORAGE_KEY);
    if (favoritesJson) {
      return JSON.parse(favoritesJson) as string[];
    }
  } catch (e) {
    console.error('读取收藏列表失败', e);
  }
  return [];
}

/**
 * 保存收藏列表
 * @param favorites 收藏的菜谱ID数组
 */
export function saveFavorites(favorites: string[]): void {
  try {
    wx.setStorageSync(STORAGE_KEY, JSON.stringify(favorites));
  } catch (e) {
    console.error('保存收藏列表失败', e);
  }
}

/**
 * 切换收藏状态
 * @param recipeId 菜谱ID
 * @returns 新的收藏状态（true表示已收藏，false表示未收藏）
 */
export function toggleFavorite(recipeId: string): boolean {
  const favorites = getFavorites();
  const index = favorites.indexOf(recipeId);
  const isFavorite = index > -1;

  if (isFavorite) {
    favorites.splice(index, 1);
  } else {
    favorites.push(recipeId);
  }

  saveFavorites(favorites);
  return !isFavorite;
}

/**
 * 检查是否已收藏
 * @param recipeId 菜谱ID
 * @returns 是否已收藏
 */
export function isFavorite(recipeId: string): boolean {
  const favorites = getFavorites();
  return favorites.includes(recipeId);
}

const FITNESS_FAVORITES_KEY = 'fitness_favorites';

function parseFitnessFavoritesRaw(raw: unknown): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x || '').trim()).filter(Boolean);
  }
  try {
    const parsed = JSON.parse(String(raw));
    return Array.isArray(parsed)
      ? parsed.map((x) => String(x || '').trim()).filter(Boolean)
      : [];
  } catch (e) {
    return [];
  }
}

export function getFitnessFavorites(): string[] {
  try {
    return parseFitnessFavoritesRaw(wx.getStorageSync(FITNESS_FAVORITES_KEY));
  } catch (e) {
    return [];
  }
}

export function saveFitnessFavorites(ids: string[]): void {
  try {
    wx.setStorageSync(FITNESS_FAVORITES_KEY, ids);
  } catch (e) {
    console.error('保存健身餐收藏失败', e);
  }
}

/** @returns 切换后是否已收藏 */
export function toggleFitnessFavorite(mealId: string): boolean {
  const list = getFitnessFavorites();
  const i = list.indexOf(mealId);
  if (i > -1) {
    list.splice(i, 1);
    saveFitnessFavorites(list);
    return false;
  }
  list.push(mealId);
  saveFitnessFavorites(list);
  return true;
}

export function isFitnessFavorite(mealId: string): boolean {
  return getFitnessFavorites().includes(mealId);
}

const CHILDREN_FAVORITES_KEY = 'children_favorites';

export function getChildrenFavorites(): string[] {
  try {
    return parseFitnessFavoritesRaw(wx.getStorageSync(CHILDREN_FAVORITES_KEY));
  } catch (e) {
    return [];
  }
}

export function saveChildrenFavorites(ids: string[]): void {
  try {
    wx.setStorageSync(CHILDREN_FAVORITES_KEY, ids);
  } catch (e) {
    console.error('保存儿童餐收藏失败', e);
  }
}

/** @returns 切换后是否已收藏 */
export function toggleChildrenFavorite(mealId: string): boolean {
  const list = getChildrenFavorites();
  const i = list.indexOf(mealId);
  if (i > -1) {
    list.splice(i, 1);
    saveChildrenFavorites(list);
    return false;
  }
  list.push(mealId);
  saveChildrenFavorites(list);
  return true;
}

export function isChildrenFavorite(mealId: string): boolean {
  return getChildrenFavorites().includes(mealId);
}
