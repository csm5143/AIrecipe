/**
 * 收藏页 - 调用 /v1/wx/app/my-collections
 * 支持离线降级
 */

const { get } = require('../../../utils/httpApi/request');
const {
  getOfflineFavoriteDetails,
  syncFavoriteDetails,
  getOfflineFavoriteIds,
} = require('../../../utils/localCache');

Page({
  data: {
    collections: [],
    loading: true,
    isEmpty: false,
    error: '',
  },

  onLoad() {},

  onShow() {
    this.loadCollections();
  },

  onPullDownRefresh() {
    this.loadCollections();
  },

  async loadCollections() {
    this.setData({ loading: true, error: '' });

    try {
      const res = await get('/v1/wx/app/my-collections', {}, {
        baseUrl: 'http://localhost:3000',
        withToken: true,
      });

      if (res.success && res.data && res.data.length > 0) {
        await syncFavoriteDetails();
        this.setData({
          collections: res.data,
          isEmpty: false,
          loading: false,
        });
      } else {
        this._loadOffline();
      }
    } catch (e) {
      console.error('[Collections] loadCollections failed:', e);
      this._loadOffline();
    } finally {
      wx.stopPullDownRefresh();
    }
  },

  _loadOffline() {
    const cached = getOfflineFavoriteDetails();
    if (cached.length > 0) {
      // 离线模式：显示收藏的菜谱直接列表
      const offlineItems = cached.map(item => ({
        id: item.id,
        name: item.title || item.name || '（无标题）',
        coverImage: item.coverImage || '',
        itemCount: 1,
        isOffline: true,
      }));
      this.setData({ collections: offlineItems, isEmpty: false, loading: false });
    } else {
      this.setData({ isEmpty: true, loading: false });
    }
  },

  onCollectionTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/collection-detail/index?id=${id}` });
  },

  onRecipeTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/recipes/detail/index?id=${id}` });
  },

  onItemTap(e) {
    const { id, offline } = e.currentTarget.dataset;
    if (offline) {
      this.onRecipeTap(e);
    } else {
      this.onCollectionTap(e);
    }
  },

  onGoExplore() {
    wx.switchTab({ url: '/pages/index/index' });
  },
});
