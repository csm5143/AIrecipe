/** 菜谱搜索历史（与菜谱列表页共用存储 key） */
export const RECIPE_SEARCH_HISTORY_KEY = 'recipeSearchHistory';

export function loadRecipeSearchHistory(): string[] {
  try {
    const raw = wx.getStorageSync(RECIPE_SEARCH_HISTORY_KEY);
    return Array.isArray(raw) ? (raw as string[]).map((x) => String(x || '').trim()).filter(Boolean) : [];
  } catch (e) {
    return [];
  }
}

export function saveRecipeSearchHistory(keyword: string) {
  const k = (keyword || '').trim();
  if (!k) return;
  try {
    let history = loadRecipeSearchHistory();
    history = [k, ...history.filter((h) => h !== k)].slice(0, 10);
    wx.setStorageSync(RECIPE_SEARCH_HISTORY_KEY, history);
  } catch (e) {
    /* ignore */
  }
}

export function clearRecipeSearchHistory() {
  try {
    wx.removeStorageSync(RECIPE_SEARCH_HISTORY_KEY);
  } catch (e) {
    /* ignore */
  }
}
