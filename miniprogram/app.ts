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
      wx.cloud.init({
        env: CLOUD_ENV_ID,
        traceUser: true
      });
      console.log('[App] 云开发已初始化，环境:', CLOUD_ENV_ID);
    }

    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      },
    })

    // 启动自动云端同步
    startAutoSync();

    // 检查并迁移旧版收藏数据
    this.migrateOldData();

    // 检查是否有保存的 openid，尝试恢复云端数据
    this.checkAndRestoreUserData();

    // 后台静默预加载云端菜谱数据（让用户打开小程序后立即开始加载）
    // 加载完成后保存到全局缓存，所有页面共享，不再重复加载
    preloadGlobalRecipes(() => {
      try {
        const raw = require('./data/recipes.json') as any;
        const rawList = Array.isArray(raw) ? raw : (raw && raw.recipes && Array.isArray(raw.recipes) ? raw.recipes : []);
        if (rawList.length > 0) {
          return rawList;
        }
      } catch (_e) {}
      return [];
    });
  },

  onShow() {
    // 每次进入小程序也启动同步
    startAutoSync();
  },

  onHide() {
    // 离开时停止自动同步
    stopAutoSync();
  },

  // 检查并恢复用户数据（基于保存的 openid）
  async checkAndRestoreUserData() {
    try {
      const savedOpenid = wx.getStorageSync('savedOpenid');
      if (savedOpenid) {
        console.log('[App] 检测到保存的 openid，尝试恢复云端数据');
        // 将保存的 openid 恢复到 userInfo 中，以便 cloudUserData.ts 可以使用
        const userInfoRaw = wx.getStorageSync('userInfo');
        const userInfo = userInfoRaw ? (typeof userInfoRaw === 'string' ? JSON.parse(userInfoRaw) : userInfoRaw) : {};
        if (!userInfo.openid) {
          userInfo.openid = savedOpenid;
          wx.setStorageSync('userInfo', JSON.stringify(userInfo));
        }
        // 从云端恢复数据
        const success = await restoreFromCloud();
        if (success) {
          console.log('[App] 云端数据恢复成功');
        } else {
          console.log('[App] 云端暂无数据或恢复失败');
        }
      }
    } catch (e) {
      console.warn('[App] 检查/恢复用户数据失败', e);
    }
  },

  // 迁移旧版数据
  migrateOldData() {
    try {
      // 1. 迁移收藏夹数据
      const { checkAndMigrateIfNeeded } = require('./utils/cloudCollections');
      const migrated = checkAndMigrateIfNeeded();
      if (migrated) {
        console.log('[App] 旧版收藏数据已迁移到新格式');
      }

      // 2. 确保有默认收藏夹（新用户）
      ensureDefaultCollection();
    } catch (e) {
      console.warn('[App] 数据迁移失败', e);
    }
  }
})
