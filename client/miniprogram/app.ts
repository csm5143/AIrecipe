// app.ts - 前后端分离架构，数据全部来自 API

import { preload } from './utils/httpServices/recipeService.js';
import { restoreSession } from './utils/httpApi/auth.js';
import { setGlobalErrorHandler } from './utils/httpApi/request.js';
import { clearWxToken } from './utils/httpApi/authStorage.js';
import { logout } from './utils/httpApi/authStorage.js';

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

    // 全局 401 处理：清除登录态并跳转登录页
    setGlobalErrorHandler((code) => {
      if (code === 401) {
        clearWxToken();
        logout();
        wx.showToast({ title: '登录已过期，请重新登录', icon: 'none', duration: 2000 });
        setTimeout(() => {
          wx.navigateTo({ url: '/subpackages/lowfreq/login/index' });
        }, 2000);
      }
    });

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
