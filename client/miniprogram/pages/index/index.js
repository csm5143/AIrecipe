/**
 * 首页 - 调用 /v1/app/content/home
 * 包含轮播图、最新菜谱、分类入口
 */

const { request } = require('../../utils/httpApi/request');

Page({
  data: {
    banners: [],
    latestRecipes: [],
    categories: [],
    loading: true,
    error: '',
  },

  onLoad() {
    this.loadHomeData();
  },

  onShow() {
    const tab = typeof this.getTabBar === 'function' && this.getTabBar();
    if (tab) {
      tab.setData({ selected: 0 });
    }
  },

  onPullDownRefresh() {
    this.loadHomeData(true);
  },

  async loadHomeData(forceRefresh = false) {
    // 优先使用缓存（30分钟有效期）
    const cached = wx.getStorageSync('home_cache_v2') || null;
    const cacheTime = wx.getStorageSync('home_cache_time') || 0;
    const isExpired = Date.now() - cacheTime > 30 * 60 * 1000;

    if (!forceRefresh && cached && !isExpired) {
      this.setData({ ...cached, loading: false });
      wx.stopPullDownRefresh();
      return;
    }

    try {
      const res = await request('/v1/app/content/home', {
        method: 'GET',
      });

      if (res.success && res.data) {
        const { banners, latestRecipes, categories } = res.data;
        wx.setStorageSync('home_cache_v2', { banners, latestRecipes, categories });
        wx.setStorageSync('home_cache_time', Date.now());
        this.setData({ banners, latestRecipes, categories, loading: false, error: '' });
      } else {
        this._loadFallback(cached);
      }
    } catch (e) {
      console.error('[Index] loadHomeData failed:', e);
      const cached2 = wx.getStorageSync('home_cache_v2') || null;
      this._loadFallback(cached2);
    } finally {
      wx.stopPullDownRefresh();
    }
  },

  _loadFallback(cached) {
    if (cached && cached.banners && cached.latestRecipes) {
      this.setData({ ...cached, loading: false, error: '' });
    } else {
      this.setData({ loading: false, error: '加载失败，请下拉刷新' });
    }
  },

  // 轮播图点击
  onBannerTap(e) {
    const { linkvalue, linktype } = e.currentTarget.dataset;
    if (!linkvalue) return;
    if (linktype === 'page') {
      wx.navigateTo({ url: linkvalue });
    }
  },

  // 点击菜谱
  onRecipeTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/recipes/detail/index?id=${id}` });
  },

  // 点击分类入口
  onCategoryTap(e) {
    const { name } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/recipes/list/index?category=${encodeURIComponent(name)}`,
    });
  },

  // 跳转到全部菜谱列表
  onViewAllRecipes() {
    wx.navigateTo({ url: '/pages/recipes/list/index' });
  },

  // 搜索
  onSearchTap() {
    wx.navigateTo({ url: '/pages/search/index' });
  },
});
