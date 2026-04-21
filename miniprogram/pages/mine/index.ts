// 我的页面：用户信息、功能菜单

import { getUserInfo, isLoggedIn } from '../../utils/userAuth';
// 获取收藏数量
function getFavoriteCount(): number {
  try {
    const favorites = wx.getStorageSync('favorites') || [];
    return Array.isArray(favorites) ? favorites.length : 0;
  } catch (e) {
    return 0;
  }
}

Page({
  data: {
    hasLogin: false,
    userInfo: {
      nickname: '',
      avatar: ''
    },
    favoriteCount: 0
  },

  onLoad() {
    this.loadUserInfo();
  },

  onShow() {
    const tab = typeof this.getTabBar === 'function' && this.getTabBar();
    if (tab) {
      tab.setData({ selected: 3 });
    }
    this.loadUserInfo();
  },

  // 加载用户信息
  loadUserInfo() {
    const hasLogin = isLoggedIn();
    const info = getUserInfo();
    const favoriteCount = getFavoriteCount();
    this.setData({
      hasLogin,
      userInfo: {
        nickname: info.nickname || '',
        avatar: info.avatar || ''
      },
      favoriteCount
    });
  },

  // 跳转到登录页面
  onGoToLogin() {
    wx.navigateTo({ url: '/subpackages/lowfreq/login/index' });
  },

  // 编辑用户信息（跳转到登录页）
  onEditUserInfo() {
    wx.navigateTo({ url: '/subpackages/lowfreq/login/index' });
  },

  // 跳转到收藏页面
  onGoToFavorites() {
    wx.switchTab({
      url: '/pages/collections/index'
    });
  },

  // 问题反馈
  onFeedback() {
    wx.navigateTo({ url: '/subpackages/lowfreq/feedback/index' });
  },

  // 关于我们
  onAbout() {
    wx.showModal({
      title: '关于我们',
      content: 'AI 智能菜谱\n\n让厨房里的食材，都有做法。\n\n我们致力于用AI技术，帮助用户发现食材的无限可能，做出美味佳肴。\n\n版本：v1.0.0',
      showCancel: false,
      confirmText: '了解了'
    });
  }
});
