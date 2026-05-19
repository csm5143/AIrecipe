/**
 * 收藏页 - 调用 /v1/wx/app/my-collections
 */

import { collectionService } from '../../utils/services/collectionService';

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
      const collections = await collectionService.getCollectionsWithCache();
      if (collections && collections.length > 0) {
        this.setData({
          collections,
          isEmpty: false,
          loading: false,
        });
      } else {
        this.setData({ isEmpty: true, loading: false });
      }
    } catch (e) {
      console.error('[Collections] loadCollections failed:', e);
      this.setData({ error: '加载失败', isEmpty: true, loading: false });
    } finally {
      wx.stopPullDownRefresh();
    }
  },

  onCollectionTap(e: any) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/collection-detail/index?id=${id}` });
  },

  onRecipeTap(e: any) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/recipes/detail/index?id=${id}` });
  },

  onGoExplore() {
    wx.switchTab({ url: '/pages/index/index' });
  },
});
