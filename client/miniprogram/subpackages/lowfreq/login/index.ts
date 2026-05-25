// 登录/个人中心页面

import {
  login as authLogin,
  updateProfile,
  getCurrentUser,
  logout as authLogout,
  changePassword,
  isLoggedIn,
} from '../../../utils/services/authService.js';
import { getUserProfile } from '../../../utils/httpApi/auth.js';
import { upload } from '../../../utils/httpApi/request.js';

Page({
  data: {
    userInfo: null as any,
    nickname: '',
    avatarUrl: '',
    phone: '',
    gender: '',
    bio: '',
    hasLogin: false,
    guestAvatarUrl: '/assets/默认头像.png',

    isAgreed: false,
    loginLoading: false,

    showEditProfile: false,
    editForm: {
      nickname: '',
      phone: '',
      gender: '',
      bio: '',
      avatarUrl: '',
    },

    showChangePassword: false,
    changePwdForm: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    changePwdLoading: false,
  },

  onLoad() {
    this.loadUserInfo();
  },

  onShow() {
    this.loadUserInfo();
  },

  async loadUserInfo() {
    const hasLogin = isLoggedIn();
    const info = getCurrentUser();

    if (hasLogin) {
      this.setData({
        userInfo: info,
        hasLogin: true,
        nickname: info?.nickname || '',
        avatarUrl: info?.avatar || '',
        phone: info?.phone || '',
        gender: info?.gender || '',
        bio: info?.bio || '',
      });
      try {
        const res = await getUserProfile();
        if (res.success && res.data) {
          this.setData({
            phone: res.data.phone || '',
            gender: res.data.gender || '',
            bio: res.data.bio || '',
            nickname: res.data.nickname || this.data.nickname,
            avatarUrl: res.data.avatar || this.data.avatarUrl,
          });
        }
      } catch (_) {}
    } else {
      this.setData({
        userInfo: null,
        hasLogin: false,
        nickname: '',
        avatarUrl: '',
        phone: '',
        gender: '',
        bio: '',
      });
    }
  },

  // ============ 头像选择（wx.chooseMedia → COS） ============

  onChangeAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempPath = res.tempFiles[0].tempFilePath;
        this.setData({ avatarUrl: tempPath });
        wx.showLoading({ title: '上传中...', mask: true });
        try {
          const uploadRes = await upload('/v1/upload/wx-avatar', tempPath, 'file', { folder: 'avatars' });
          if (!uploadRes.success || !uploadRes.data?.url) throw new Error('上传失败');
          await updateProfile({ avatar: uploadRes.data.url });
          wx.hideLoading();
          this.loadUserInfo();
          wx.showToast({ title: '头像已更新', icon: 'success' });
        } catch {
          wx.hideLoading();
          wx.showToast({ title: '上传失败', icon: 'none' });
        }
      },
    });
  },

  // 弹窗内换头像
  onEditAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempPath = res.tempFiles[0].tempFilePath;
        this.setData({ editForm: { ...this.data.editForm, avatarUrl: tempPath } });
        wx.showLoading({ title: '上传中...', mask: true });
        try {
          const uploadRes = await upload('/v1/upload/wx-avatar', tempPath, 'file', { folder: 'avatars' });
          if (!uploadRes.success || !uploadRes.data?.url) throw new Error('上传失败');
          wx.hideLoading();
          this.setData({ editForm: { ...this.data.editForm, avatarUrl: uploadRes.data.url } });
          wx.showToast({ title: '头像已就绪', icon: 'success' });
        } catch {
          wx.hideLoading();
          wx.showToast({ title: '上传失败', icon: 'none' });
        }
      },
    });
  },

  // ============ 微信一键登录 ============

  async onWechatLogin() {
    if (!this.data.isAgreed) {
      wx.showToast({ title: '请阅读并勾选用户协议', icon: 'none', duration: 2000 });
      return;
    }

    this.setData({ loginLoading: true });
    wx.showLoading({ title: '登录中...', mask: true });

    try {
      const result = await authLogin({
        nickName: this.data.nickname || undefined,
        avatarUrl: this.data.avatarUrl || undefined,
      });

      if (!result.success) throw new Error(result.error || '登录失败');

      wx.hideLoading();
      this.setData({ loginLoading: false });

      const updated = getCurrentUser();
      this.setData({
        userInfo: updated,
        hasLogin: true,
        nickname: updated?.nickname || '',
        avatarUrl: updated?.avatar || '',
        phone: updated?.phone || '',
        gender: updated?.gender || '',
        bio: updated?.bio || '',
      });

      wx.showToast({ title: result.isNewUser ? '注册成功' : '登录成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1500);
    } catch (err: any) {
      wx.hideLoading();
      this.setData({ loginLoading: false });
      wx.showToast({ title: err.message || '登录失败', icon: 'none' });
    }
  },

  onToggleAgreement() {
    this.setData({ isAgreed: !this.data.isAgreed });
  },

  // ============ 编辑资料弹窗 ============

  onEditProfile() {
    this.setData({
      showEditProfile: true,
      editForm: {
        nickname: this.data.nickname,
        phone: this.data.phone,
        gender: this.data.gender,
        bio: this.data.bio,
        avatarUrl: this.data.avatarUrl,
      },
    });
  },

  onCloseEditProfile() {
    this.setData({ showEditProfile: false });
  },

  onEditFormInput(e: any) {
    const field = e.currentTarget.dataset.field as string;
    this.setData({
      editForm: { ...this.data.editForm, [field]: e.detail.value },
    });
  },

  onSelectGender(e: any) {
    const gender = e.currentTarget.dataset.gender as string;
    if (gender) {
      this.setData({ editForm: { ...this.data.editForm, gender } });
    }
  },

  onConfirmEditProfile() {
    const f = this.data.editForm;
    if (!f.nickname || !f.nickname.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }
    if (f.nickname.trim().length > 20) {
      wx.showToast({ title: '昵称不能超过20字', icon: 'none' });
      return;
    }
    if (f.bio && f.bio.length > 100) {
      wx.showToast({ title: '简介不能超过100字', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中...', mask: true });
    updateProfile({
      nickname: f.nickname.trim(),
      avatar: f.avatarUrl || undefined,
      gender: f.gender || 'UNKNOWN',
      bio: f.bio?.trim() || undefined,
      phone: f.phone?.trim() || undefined,
    })
      .then(() => {
        wx.hideLoading();
        this.setData({ showEditProfile: false });
        this.loadUserInfo();
        wx.showToast({ title: '保存成功', icon: 'success' });
      })
      .catch(() => {
        wx.hideLoading();
        wx.showToast({ title: '保存失败', icon: 'none' });
      });
  },

  // ============ 修改密码 ============

  onChangePassword() {
    this.setData({
      showChangePassword: true,
      changePwdForm: { oldPassword: '', newPassword: '', confirmPassword: '' },
    });
  },

  onCloseChangePassword() {
    this.setData({ showChangePassword: false });
  },

  onChangePwdInput(e: any) {
    const field = e.currentTarget.dataset.field as string;
    this.setData({
      changePwdForm: { ...this.data.changePwdForm, [field]: e.detail.value },
    });
  },

  onConfirmChangePassword() {
    const { oldPassword, newPassword, confirmPassword } = this.data.changePwdForm;
    if (!newPassword || newPassword.length < 6) {
      wx.showToast({ title: '新密码不能少于6位', icon: 'none' });
      return;
    }
    if (newPassword !== confirmPassword) {
      wx.showToast({ title: '两次密码输入不一致', icon: 'none' });
      return;
    }
    this.setData({ changePwdLoading: true });
    wx.showLoading({ title: '修改中...', mask: true });
    changePassword(oldPassword, newPassword)
      .then((result) => {
        wx.hideLoading();
        this.setData({ changePwdLoading: false, showChangePassword: false });
        if (result.success) {
          wx.showToast({ title: '密码修改成功', icon: 'success' });
        } else {
          wx.showToast({ title: result.message || '修改失败', icon: 'none' });
        }
      })
      .catch(() => {
        wx.hideLoading();
        this.setData({ changePwdLoading: false });
        wx.showToast({ title: '修改失败，请重试', icon: 'none' });
      });
  },

  // ============ 退出登录 ============

  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          authLogout();
          this.setData({
            userInfo: null,
            hasLogin: false,
            nickname: '',
            avatarUrl: '',
            phone: '',
            gender: '',
            bio: '',
            isAgreed: false,
          });
          wx.showToast({ title: '已退出登录', icon: 'success' });
        }
      },
    });
  },

  noop() {},
  preventTouchMove() { return false; },

  onViewAgreement() {
    wx.showModal({
      title: '用户协议',
      content: `AI智能菜谱用户服务协议\n\n一、服务说明\n"吃了么"AI智能菜谱是一款帮助用户发现食材做法、推荐菜谱的应用程序。\n\n二、账号注册\n1. 您使用微信账号一键注册\n2. 一个微信账号绑定一个用户账号\n\n三、使用规则\n1. 菜谱内容仅供参考\n2. 如有过敏史请在使用前咨询专业人士\n\n四、免责声明\n菜谱内容仅供参考，使用前请确保食材新鲜。`,
      showCancel: false,
      confirmText: '我知道了',
    });
  },

  onViewPrivacy() {
    wx.showModal({
      title: '隐私政策',
      content: `AI智能菜谱隐私政策\n\n一、信息收集\n1. 头像和昵称：您主动选择上传的内容\n2. 微信账号信息：通过微信授权获取\n\n二、信息使用\n您的信息将用于提供个性化服务和保存偏好设置\n\n三、信息存储\n数据采用加密存储，保障信息安全\n\n四、联系我们\ncontact@airecipe.com`,
      showCancel: false,
      confirmText: '我知道了',
    });
  },
});
