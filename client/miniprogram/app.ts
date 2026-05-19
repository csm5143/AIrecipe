// app.ts - 前后端分离架构，数据全部来自 API

import { preload } from './utils/httpServices/recipeService';
import { restoreSession } from './utils/httpApi/auth';

App<IAppOption>({
  globalData: {
    recipesCache: null as any,
    ingredientsCache: null,
    cacheTimestamp: 0,
  },

  onLaunch() {
    const logs = wx.getStorageSync('logs') || [];
    logs.unshift(Date.now());
    wx.setStorageSync('logs', logs.slice(0, 100));

    // 预登录（非阻塞）
    wx.login({});

    // 后台静默恢复会话
    restoreSession().catch(() => {});

    // 预加载菜谱（后台静默，失败不阻塞）
    this.preloadRecipes();
  },

  onShow() {
    // nothing to do
  },

  // 预加载菜谱数据（后台静默，失败不阻塞）
  preloadRecipes() {
    try {
      preload();
    } catch (e) {
      console.warn('[App] 预加载菜谱失败', e);
    }
  },
});
