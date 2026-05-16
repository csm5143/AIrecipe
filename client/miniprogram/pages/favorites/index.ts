// 收藏列表页 - 已升级为多收藏夹系统
// 此页面现在作为跳转入口，引导用户到新的收藏夹列表页面

import { syncDebounced } from '../../utils/dataSync';
import { checkAndMigrateIfNeeded } from '../../utils/cloudCollections';

Page({
  data: {
    shouldRedirect: true
  },

  onLoad() {
    // 检查并迁移旧数据
    const migrated = checkAndMigrateIfNeeded();
    if (migrated) {
      console.log('[Favorites] 旧收藏数据已迁移到多收藏夹系统');
    }

    // 直接跳转到收藏夹列表页面
    setTimeout(() => {
      wx.redirectTo({
        url: '/pages/collections/index'
      });
    }, 100);
  },

  onShow() {
    const tab = typeof this.getTabBar === 'function' && this.getTabBar();
    if (tab) {
      tab.setData({ selected: 2 });
    }

    // 如果还在本页面（防止循环），立即跳转
    if (this.data.shouldRedirect) {
      wx.redirectTo({
        url: '/pages/collections/index'
      });
    }
  },

  // 兼容旧版的收藏操作（保留函数签名，内部处理）
  onRecipeTap(e: WechatMiniprogram.BaseEvent) {
    const id = e.currentTarget.dataset.id as string;
    if (!id) return;

    // 跳转到详情页（旧版兼容）
    wx.navigateTo({
      url: `/pages/recipes/detail?id=${id}`
    });
  },

  onToggleFavorite(e: WechatMiniprogram.BaseEvent) {
    const id = e.currentTarget.dataset.id as string;
    if (!id) return;

    // 旧版收藏操作（现在直接跳转到收藏夹选择）
    wx.showModal({
      title: '功能升级',
      content: '收藏功能已升级为收藏夹系统，请前往"我的收藏"页面管理收藏',
      confirmText: '前往',
      success: (res) => {
        if (res.confirm) {
          wx.redirectTo({
            url: '/pages/collections/index'
          });
        }
      }
    });
  }
});
