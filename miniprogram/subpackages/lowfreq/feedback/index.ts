/**
 * 问题反馈页面
 * 支持提交反馈到云数据库，同时保存到本地
 */

import {
  getUserType,
} from '../../../utils/cloudUserData';
import { submitFeedbackToCloud, getLocalFeedbackHistory, FEEDBACK_TYPE_MAP, type FeedbackType } from '../../../utils/cloudFeedback';
import { getUserInfo, isFormalUser } from '../../../utils/userAuth';

interface FeedbackItem {
  id: string;
  type: string;
  typeLabel: string;
  content: string;
  contact: string;
  images: string[];
  createTime: number;
  status: 'pending' | 'processing' | 'resolved' | 'rejected';
}

Page({
  data: {
    typeList: [
      { label: 'Bug反馈', value: 'bug' },
      { label: '功能建议', value: 'suggest' },
      { label: '内容纠错', value: 'error' },
      { label: '其他问题', value: 'other' }
    ],
    selectedType: '',
    selectedTypeLabel: '',
    content: '',
    contentLength: 0,
    imageList: [] as string[],
    contact: '',
    isSubmitting: false,
    // 用户信息
    userType: 'guest' as 'user' | 'visitor' | 'guest',
    showUserTip: false
  },

  onLoad() {
    // 获取用户类型
    const userType = getUserType();
    const showTip = userType === 'visitor' || userType === 'none';
    
    this.setData({
      userType: userType === 'user' ? 'user' : (userType === 'visitor' ? 'visitor' : 'guest'),
      showUserTip: showTip
    });
  },

  // 选择问题类型
  onSelectType(e: WechatMiniprogram.BaseEvent) {
    const type = e.currentTarget.dataset.type as string;
    const typeItem = this.data.typeList.find(t => t.value === type);
    this.setData({
      selectedType: type,
      selectedTypeLabel: typeItem ? typeItem.label : ''
    });
  },

  // 输入反馈内容
  onContentInput(e: WechatMiniprogram.Input) {
    const value = e.detail.value || '';
    this.setData({
      content: value,
      contentLength: value.length
    });
  },

  // 输入联系方式
  onContactInput(e: WechatMiniprogram.Input) {
    this.setData({ contact: e.detail.value || '' });
  },

  // 选择图片
  onChooseImage() {
    if (this.data.imageList.length >= 3) {
      wx.showToast({ title: '最多上传3张图片', icon: 'none' });
      return;
    }
    wx.chooseImage({
      count: 3 - this.data.imageList.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          imageList: [...this.data.imageList, ...res.tempFilePaths]
        });
      },
      fail: (err) => {
        if (err.errMsg && err.errMsg.indexOf('cancel') === -1) {
          wx.showToast({ title: '选择图片失败', icon: 'none' });
        }
      }
    });
  },

  // 移除图片
  onRemoveImage(e: WechatMiniprogram.BaseEvent) {
    const index = e.currentTarget.dataset.index as number;
    const list = [...this.data.imageList];
    list.splice(index, 1);
    this.setData({ imageList: list });
  },

  // 预览图片
  onPreviewImage(e: WechatMiniprogram.BaseEvent) {
    const index = e.currentTarget.dataset.index as number;
    wx.previewImage({
      current: this.data.imageList[index],
      urls: this.data.imageList
    });
  },

  // 提交反馈
  async onSubmit() {
    const { selectedType, selectedTypeLabel, content, contact, imageList } = this.data;

    // 验证必填项
    if (!selectedType) {
      wx.showToast({ title: '请选择问题类型', icon: 'none' });
      return;
    }

    if (!content.trim()) {
      wx.showToast({ title: '请输入反馈内容', icon: 'none' });
      return;
    }

    if (content.trim().length < 10) {
      wx.showToast({ title: '反馈内容至少10个字', icon: 'none' });
      return;
    }

    this.setData({ isSubmitting: true });

    // 显示加载提示
    wx.showLoading({ title: '提交中...', mask: true });

    try {
      // 提交到云端
      const result = await submitFeedbackToCloud({
        type: selectedType as FeedbackType,
        typeLabel: selectedTypeLabel,
        content: content.trim(),
        contact: contact.trim(),
        images: imageList
      });

      wx.hideLoading();

      if (result.success) {
        wx.showToast({ title: '反馈提交成功', icon: 'success' });
        
        // 延迟返回
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        // 云端提交失败，尝试本地保存
        console.warn('[Feedback] 云端提交失败，使用本地保存');
        this.saveFeedbackLocally();
        
        wx.showToast({ title: '已本地保存，将在网络恢复后同步', icon: 'none', duration: 3000 });
        setTimeout(() => {
          wx.navigateBack();
        }, 2000);
      }
    } catch (e: any) {
      wx.hideLoading();
      console.error('[Feedback] 提交失败', e);
      
      // 网络错误，本地保存
      this.saveFeedbackLocally();
      
      wx.showToast({ title: '网络异常，已本地保存', icon: 'none', duration: 3000 });
      setTimeout(() => {
        wx.navigateBack();
      }, 2000);
    } finally {
      this.setData({ isSubmitting: false });
    }
  },

  // 本地保存反馈（作为兜底）
  saveFeedbackLocally() {
    try {
      const { selectedType, selectedTypeLabel, content, contact, imageList } = this.data;
      
      const feedback: FeedbackItem = {
        id: `fb_local_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        type: selectedType,
        typeLabel: selectedTypeLabel,
        content: content.trim(),
        contact: contact.trim(),
        images: imageList,
        createTime: Date.now(),
        status: 'pending'
      };

      const raw = wx.getStorageSync('local_feedback_pending');
      const list: FeedbackItem[] = raw ? JSON.parse(raw as string) : [];
      list.unshift(feedback);
      wx.setStorageSync('local_feedback_pending', JSON.stringify(list));
      
      console.log('[Feedback] 反馈已本地保存，等待同步');
    } catch (e) {
      console.error('[Feedback] 本地保存失败', e);
    }
  },

  // 查看用户类型说明
  onShowUserTip() {
    const tip = this.data.userType === 'guest' 
      ? '您目前是游客身份，反馈数据将关联到您的匿名ID。登录后可将数据同步到账号下。'
      : '您的反馈数据将关联到您的匿名ID，登录后可将数据同步到账号下。';
    
    wx.showModal({
      title: '关于数据关联',
      content: tip,
      showCancel: false,
      confirmText: '我知道了'
    });
  },

  // 前往登录
  onGoToLogin() {
    wx.navigateTo({
      url: '/subpackages/lowfreq/login/index'
    });
  }
});
