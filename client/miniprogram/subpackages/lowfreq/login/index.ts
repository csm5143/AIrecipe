// 登录页面：微信一键登录 + 完整资料编辑（统一 authService）

import {
  login as authLogin,
  updateProfile,
  getCurrentUser,
  logout as authLogout,
  changePassword,
  isLoggedIn,
} from '../../../utils/services/authService.js';
import { getUserProfile } from '../../../utils/httpApi/auth.js';

Page({
  data: {
    // 用户信息
    userInfo: null as any,
    nickname: '',
    avatarUrl: '',
    phone: '',
    gender: '',
    bio: '',
    hasLogin: false,
    guestAvatarUrl: '/assets/默认头像.png',

    // 登录状态
    isAgreed: false,
    loginLoading: false,

    // 资料编辑弹窗
    showEditProfile: false,
    editForm: {
      nickname: '',
      phone: '',
      gender: '',
      bio: '',
      avatarUrl: '',
    },

    // 修改密码弹窗
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

  // ============ 加载用户信息 ============
  async loadUserInfo() {
    const hasLogin = isLoggedIn();
    const info = getCurrentUser();

    if (hasLogin) {
      // 先用本地数据快速显示，再从后端拉取完整资料
      this.setData({
        userInfo: info,
        hasLogin: true,
        nickname: info?.nickname || '',
        avatarUrl: info?.avatar || '',
        phone: info?.phone || '',
        gender: info?.gender || '',
        bio: info?.bio || '',
      });
      // 从后端拉取最新资料（含 bio, gender, phone）
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
      } catch (e) {
        console.warn('[Login] 获取后端用户资料失败', e);
      }
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

      if (!result.success) {
        throw new Error(result.error || '登录失败');
      }

      wx.hideLoading();
      this.setData({ loginLoading: false });

      // 重新获取完整用户信息（含 gender, bio 等）
      const updatedInfo = getCurrentUser();
      this.setData({
        userInfo: updatedInfo,
        hasLogin: true,
        nickname: updatedInfo?.nickname || '',
        avatarUrl: updatedInfo?.avatar || '',
        phone: updatedInfo?.phone || '',
        gender: updatedInfo?.gender || '',
        bio: updatedInfo?.bio || '',
      });

      wx.showToast({
        title: result.isNewUser ? '注册成功' : '登录成功',
        icon: 'success',
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (err: any) {
      console.error('[Login] 微信登录失败', err);
      wx.hideLoading();
      this.setData({ loginLoading: false });
      wx.showToast({ title: err.message || '登录失败，请重试', icon: 'none' });
    }
  },

  onToggleAgreement() {
    this.setData({ isAgreed: !this.data.isAgreed });
  },

  // ============ 头像选择 ============
  onChooseAvatar(e: any) {
    const avatarUrl = e.detail.avatarUrl;
    if (this.data.hasLogin) {
      // 已登录：直接更新头像
      this.setData({ avatarUrl });
      updateProfile({ avatar: avatarUrl }).then((synced) => {
        if (synced) {
          this.loadUserInfo();
          wx.showToast({ title: '头像已更新', icon: 'success' });
        }
      });
    } else {
      // 未登录：先保存到表单
      const editForm = { ...this.data.editForm, avatarUrl };
      this.setData({
        avatarUrl,
        editForm,
      });
    }
  },

  // ============ 资料编辑弹窗 ============
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
    const value = e.detail.value;
    this.setData({
      editForm: { ...this.data.editForm, [field]: value },
    });
  },

  onSelectGender(e: any) {
    const gender = e.currentTarget.dataset.gender as string;
    if (gender) {
      this.setData({ editForm: { ...this.data.editForm, gender } });
    }
  },

  onConfirmEditProfile() {
    const form = this.data.editForm;

    if (!form.nickname || !form.nickname.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }
    if (form.nickname.trim().length > 20) {
      wx.showToast({ title: '昵称不能超过20字', icon: 'none' });
      return;
    }
    if (form.bio && form.bio.length > 100) {
      wx.showToast({ title: '简介不能超过100字', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中...', mask: true });

    updateProfile({
      nickname: form.nickname.trim(),
      avatar: form.avatarUrl || undefined,
      gender: form.gender || 'UNKNOWN',
      bio: form.bio?.trim() || undefined,
      phone: form.phone?.trim() || undefined,
    }).then((synced) => {
      wx.hideLoading();
      this.setData({ showEditProfile: false });
      this.loadUserInfo();
      wx.showToast({
        title: synced ? '保存成功' : '保存成功（网络同步失败）',
        icon: 'success',
      });
    }).catch(() => {
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
    const value = e.detail.value;
    this.setData({
      changePwdForm: { ...this.data.changePwdForm, [field]: value },
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

  preventTouchMove() {
    return false;
  },

  onViewAgreement() {
    wx.showModal({
      title: '用户协议',
      content: `AI智能菜谱用户服务协议

一、服务说明
"吃了么"AI智能菜谱是一款帮助用户发现食材做法、推荐菜谱的应用程序。

二、账号注册
1. 您使用微信账号一键注册，无需设置密码
2. 一个微信账号绑定一个用户账号

三、使用规则
1. 您同意并承诺按照本协议使用本服务
2. 您承诺遵守当地法律法规
3. 菜谱内容仅供参考

四、免责声明
1. 菜谱内容仅供参考，使用前请确保食材新鲜
2. 如有过敏史请在使用前咨询专业人士

五、账号管理
1. 您可以随时退出登录，账号永久保留
2. 账号数据将同步至服务器，可在多设备登录`,
      showCancel: false,
      confirmText: '我知道了',
    });
  },

  onViewPrivacy() {
    wx.showModal({
      title: '隐私政策',
      content: `AI智能菜谱隐私政策

一、信息收集
1. 头像和昵称：您主动选择上传的内容
2. 微信账号信息：通过微信授权获取，用于账号绑定
3. 收藏记录：您主动收藏的菜谱数据

二、信息使用
1. 您的微信账号用于账号绑定，一个微信一个账号
2. 您的信息将用于提供个性化服务和保存您的偏好设置

三、信息存储
1. 您的信息关联到您的微信账号，可在云端安全存储
2. 数据采用加密存储，保障信息安全

四、信息保护
1. 我们采用业界标准的安全措施保护您的信息
2. 未经您的授权，我们不会向第三方披露您的个人信息

五、联系我们
如对隐私政策有任何疑问，请联系：contact@airecipe.com`,
      showCancel: false,
      confirmText: '我知道了',
    });
  },
});
