// app.ts - 云开发已移除，纯本地存储版本

import { preloadGlobalRecipes } from './utils/dataLoader';
import { ensureDefaultCollection } from './utils/collections';

App<IAppOption>({
  globalData: {
    recipesCache: null as any,
    ingredientsCache: null,
    cacheTimestamp: 0,
  },

  onLaunch() {
    // 展示本地存储日志
    const logs = wx.getStorageSync('logs') || [];
    logs.unshift(Date.now());
    wx.setStorageSync('logs', logs.slice(0, 100));

    // 预登录（非阻塞）
    wx.login({});

    // 初始化本地收藏夹
    this.initLocalData();
  },

  onShow() {
    // nothing to do
  },

  // 初始化本地数据
  initLocalData() {
    try {
      ensureDefaultCollection();
      this.preloadRecipes();
    } catch (e) {
      console.warn('[App] 初始化本地数据失败', e);
    }
  },

  // 预加载菜谱数据
  preloadRecipes() {
    try {
      preloadGlobalRecipes(() => []);
    } catch (e) {
      console.warn('[App] 预加载菜谱失败', e);
    }
  },
});
