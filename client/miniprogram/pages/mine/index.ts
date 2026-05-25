// 我的页面：用户信息 + 功能菜单

import { getCurrentUser, authService, updateProfile } from '../../utils/services/authService.js';
import { collectionService } from '../../utils/services/collectionService.js';
import { getPreferenceStats } from '../../utils/preferenceStore.js';
import { upload } from '../../utils/httpApi/request.js';

function getFridgeItemCount(): number {
  try {
    const raw = wx.getStorageSync('littleFridgeV2') || '[]';
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.length : 0;
  } catch (_) {
    return 0;
  }
}

Page({
  data: {
    hasLogin: false,
    userInfo: { nickname: '', avatar: '' },
    favoriteCount: 0,
    fridgeItemCount: 0,
    preferenceCount: 0,
  },

  onLoad() {
    this.loadUserInfo();
  },

  onShow() {
    const tab = typeof this.getTabBar === 'function' && this.getTabBar();
    if (tab) tab.setData({ selected: 3 });
    this.loadUserInfo();
  },

  async loadUserInfo() {
    const hasLogin = authService.isLoggedIn();
    const info = getCurrentUser();
    const fridgeItemCount = getFridgeItemCount();
    const stats = getPreferenceStats();

    let favoriteCount = 0;
    if (hasLogin) {
      try {
        const cols = await collectionService?.getCollectionsWithCache?.();
        favoriteCount = cols?.reduce?.((sum: number, c: any) => sum + (c.itemCount || c.recipeCount || 0), 0) || 0;
      } catch (_) {}
    }

    this.setData({
      hasLogin,
      userInfo: {
        nickname: info?.nickname || '',
        avatar: info?.avatar || '',
      },
      favoriteCount,
      fridgeItemCount,
      preferenceCount: stats.total,
    });
  },

  // ============ 用户的头像 / 资料交互 ============

  // 更换头像（仅登录后可用）
  async onChangeAvatar() {
    if (!this.data.hasLogin) {
      this.onGoToLogin();
      return;
    }
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempPath = res.tempFiles[0].tempFilePath;
        this.setData({ 'userInfo.avatar': tempPath });
        wx.showLoading({ title: '上传中...', mask: true });
        try {
          const uploadRes = await upload('/v1/upload/wx-avatar', tempPath, 'file', { folder: 'avatars' });
          if (!uploadRes.success || !uploadRes.data?.url) {
            throw new Error('上传失败');
          }
          const cosUrl = uploadRes.data.url;
          await updateProfile({ avatar: cosUrl });
          wx.hideLoading();
          this.loadUserInfo();
          wx.showToast({ title: '头像已更新', icon: 'success' });
        } catch {
          wx.hideLoading();
          wx.showToast({ title: '上传失败，请重试', icon: 'none' });
        }
      },
    });
  },

  // 点击昵称/箭头 → 跳登录页查看完整资料
  onGoToProfile() {
    wx.navigateTo({ url: '/subpackages/lowfreq/login/index' });
  },

  // 未登录 → 跳登录
  onGoToLogin() {
    wx.navigateTo({ url: '/subpackages/lowfreq/login/index' });
  },

  // ============ 菜单入口 ============

  onGoToFridge() {
    wx.navigateTo({ url: '/pages/fridge/index' });
  },

  onGoToBasket() {
    wx.navigateTo({ url: '/pages/basket/index' });
  },

  onGoToFavorites() {
    wx.switchTab({ url: '/pages/collections/index' });
  },

  onGoToPreference() {
    wx.navigateTo({ url: '/pages/preference/index' });
  },

  onFeedback() {
    wx.navigateTo({ url: '/subpackages/lowfreq/feedback/index' });
  },

  onAbout() {
    wx.showModal({
      title: '关于我们',
      content: 'AI 智能菜谱\n\n让厨房里的食材，都有做法。\n\n版本：v1.0.0',
      showCancel: false,
      confirmText: '了解了',
    });
  },
});
