// app.ts

import { startAutoSync, stopAutoSync, restoreFromCloud } from './utils/dataSync';
import { preloadGlobalRecipes } from './utils/dataLoader';
import { Recipe } from './types/index';
import { checkAndMigrateIfNeeded } from './utils/cloudCollections';
import { ensureDefaultCollection } from './utils/collections';

// 云开发环境 ID
const CLOUD_ENV_ID = 'cloud1-3gyq7jzx76f46edc';

App<IAppOption>({
  globalData: {
    recipesCache: null as Recipe[] | null,
    ingredientsCache: null,
    cacheTimestamp: 0
  },
  onLaunch() {
    // 初始化云开发
    if (wx.cloud) {
      try {
        wx.cloud.init({
          env: CLOUD_ENV_ID,
          traceUser: true
        });
      } catch (e) {
        console.warn('[App] 云开发初始化失败:', e);
      }
    }

    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || [];
    logs.unshift(Date.now());
    wx.setStorageSync('logs', logs);

    // 登录（非阻塞）
    wx.login({});

    // 迁移旧版数据（同步执行）
    this.migrateOldData();

    // 启动自动云端同步（延迟执行，避免阻塞启动）
    setTimeout(() => {
      try {
        startAutoSync();
      } catch (e) {}
    }, 2000);

    // 检查是否有保存的 openid，尝试恢复云端数据（异步执行，不阻塞）
    setTimeout(() => {
      this.checkAndRestoreUserData();
    }, 1000);

    // 后台静默预加载云端菜谱数据（延迟执行）
    setTimeout(() => {
      this.preloadRecipes();
    }, 500);
  },

  onShow() {
    setTimeout(() => {
      try {
        startAutoSync();
      } catch (e) {}
    }, 1000);
  },

  onHide() {
    try {
      stopAutoSync();
    } catch (e) {}
  },

  // 预加载菜谱
  preloadRecipes() {
    try {
      preloadGlobalRecipes(() => {
        return [];
      });
    } catch (e) {}
  },

  // 检查并恢复用户数据（基于保存的 openid）
  async checkAndRestoreUserData() {
    try {
      const savedOpenid = wx.getStorageSync('savedOpenid');
      if (savedOpenid) {
        const userInfoRaw = wx.getStorageSync('userInfo');
        const userInfo = userInfoRaw ? (typeof userInfoRaw === 'string' ? JSON.parse(userInfoRaw) : userInfoRaw) : {};
        if (!userInfo.openid) {
          userInfo.openid = savedOpenid;
          wx.setStorageSync('userInfo', JSON.stringify(userInfo));
        }
        await restoreFromCloud();
      }
    } catch (e) {}
  },

  // 迁移旧版数据
  migrateOldData() {
    try {
      checkAndMigrateIfNeeded();
      ensureDefaultCollection();
    } catch (e) {}
  }
})
