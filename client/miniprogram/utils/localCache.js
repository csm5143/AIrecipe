/**
 * 离线收藏缓存工具
 * 提供离线收藏、离线缓存详情、联网同步等能力
 */

const FAVORITES_KEY = 'offline_favorites';

/**
 * 获取本地存储的收藏 ID 列表
 * @returns {{ recipeId: string, addedAt: number }[]}
 */
export function getOfflineFavoriteIds() {
  return wx.getStorageSync(FAVORITES_KEY) || [];
}

/**
 * 添加离线收藏（仅缓存，无网络请求）
 * @param {string|number} recipeId
 * @param {object} recipeData - 菜谱完整数据，用于离线查看
 */
export function addOfflineFavorite(recipeId, recipeData) {
  const favorites = wx.getStorageSync(FAVORITES_KEY) || [];
  const exists = favorites.some(f => String(f.recipeId) === String(recipeId));
  if (!exists) {
    favorites.unshift({ recipeId: String(recipeId), addedAt: Date.now() });
    wx.setStorageSync(FAVORITES_KEY, favorites);
  }
  wx.setStorageSync(`favorite_detail_${recipeId}`, recipeData);
}

/**
 * 移除离线收藏
 * @param {string|number} recipeId
 */
export function removeOfflineFavorite(recipeId) {
  const favorites = (wx.getStorageSync(FAVORITES_KEY) || [])
    .filter(f => String(f.recipeId) !== String(recipeId));
  wx.setStorageSync(FAVORITES_KEY, favorites);
  wx.removeStorageSync(`favorite_detail_${recipeId}`);
}

/**
 * 检查指定菜谱是否已离线收藏
 * @param {string|number} recipeId
 * @returns {boolean}
 */
export function hasOfflineFavorite(recipeId) {
  const favorites = getOfflineFavoriteIds();
  return favorites.some(f => String(f.recipeId) === String(recipeId));
}

/**
 * 获取所有离线收藏的菜谱详情
 * @returns {object[]}
 */
export function getOfflineFavoriteDetails() {
  const favorites = getOfflineFavoriteIds();
  return favorites.map(f => {
    const detail = wx.getStorageSync(`favorite_detail_${f.recipeId}`);
    if (detail) return detail;
    return {
      id: f.recipeId,
      title: '（离线缓存）',
      _offline: true,
      coverImage: '',
    };
  });
}

/**
 * 联网时同步：将所有离线收藏的 ID 批量拉取最新详情并缓存
 */
export async function syncFavoriteDetails() {
  const favorites = getOfflineFavoriteIds();
  if (!favorites.length) return;

  const ids = favorites.map(f => f.recipeId);
  try {
    const res = await new Promise((resolve, reject) => {
      wx.request({
        url: 'http://localhost:3000/v1/app/recipes',
        method: 'GET',
        data: { ids: ids.join(','), pageSize: 100 },
        timeout: 15000,
        success: (r) => resolve(r.data),
        fail: reject,
      });
    });
    if (res.success && Array.isArray(res.data)) {
      res.data.forEach(recipe => {
        wx.setStorageSync(`favorite_detail_${recipe.id}`, recipe);
      });
    }
  } catch (e) {
    console.warn('[localCache] syncFavoriteDetails failed:', e);
  }
}

/**
 * 检查网络是否可用
 * @returns {Promise<boolean>}
 */
export function isNetworkAvailable() {
  return new Promise(resolve => {
    wx.getNetworkType({
      success: r => resolve(r.networkType !== 'none'),
      fail: () => resolve(false),
    });
  });
}

/**
 * 清空所有离线收藏缓存
 */
export function clearOfflineFavorites() {
  const favorites = getOfflineFavoriteIds();
  favorites.forEach(f => wx.removeStorageSync(`favorite_detail_${f.recipeId}`));
  wx.removeStorageSync(FAVORITES_KEY);
}
