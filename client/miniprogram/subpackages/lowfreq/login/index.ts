// 登录页面：微信一键登录（统一 authService）

import { login as authLogin, updateProfile, getCurrentUser, logout as authLogout } from '../../../utils/services/authService';

Page({
  data: {
    userInfo: null as any,
    nickname: '',
    avatarUrl: '',
    guestAvatarUrl: '/assets/默认头像.png',
    hasLogin: false,
    showNicknameInput: false,
    tempNickname: '',
    isAgreed: false,
    isRestoring: false,
    loginLoading: false,
  },

  onLoad() {
    this.loadUserInfo();
  },

  onShow() {
    this.loadUserInfo();
  },

  loadUserInfo() {
    const info = getCurrentUser();
    // 只要有 loginState=true 就视为已登录，nickname 为空是正常的（注册时未填）
    const hasLogin = !!(info && info.loginState);

    this.setData({
      userInfo: info,
      hasLogin,
      nickname: info?.nickname || '',
      avatarUrl: info?.avatar || '',
    });
  },

  onToggleAgreement() {
    this.setData({ isAgreed: !this.data.isAgreed });
  },

  onChooseAvatar(e: any) {
    const avatarUrl = e.detail.avatarUrl;
    this.setData({ avatarUrl });

    const nickname = this.data.tempNickname || this.data.nickname;
    if (nickname) {
      updateProfile(nickname, avatarUrl);
      this.setData({ hasLogin: true });
      wx.showToast({ title: '头像已更新', icon: 'success' });
    }
  },

  onNicknameInput(e: any) {
    this.setData({ tempNickname: e.detail.value });
  },

  onClearNickname() {
    this.setData({ tempNickname: '' });
  },

  async onWechatLogin() {
    if (!this.data.isAgreed) {
      wx.showToast({ title: '请阅读并勾选用户协议', icon: 'none', duration: 2000 });
      return;
    }

    this.setData({ loginLoading: true });
    wx.showLoading({ title: '登录中...', mask: true });

    try {
      // 优先使用用户输入的昵称，其次用已有的昵称，都没有则留空让后端生成
      const nickname = this.data.tempNickname.trim() || this.data.nickname || undefined;
      const avatarUrl = this.data.avatarUrl || undefined;

      // 如果没有昵称，引导用户先填写
      if (!nickname) {
        wx.hideLoading();
        this.setData({ loginLoading: false });
        wx.showToast({ title: '请先设置昵称', icon: 'none' });
        this.setData({ showNicknameInput: true });
        return;
      }

      const result = await authLogin({
        nickName: nickname,
        avatarUrl: avatarUrl,
      });

      if (!result.success) {
        throw new Error(result.error || '登录失败');
      }

      // authService.login 已经从数据库获取最新资料并保存到本地，直接刷新页面显示
      wx.hideLoading();
      this.loadUserInfo(); // 重新加载，显示数据库中的昵称/头像
      this.setData({ loginLoading: false });

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

  onShowNicknameInput() {
    this.setData({
      showNicknameInput: true,
      tempNickname: this.data.nickname || '',
    });
  },

  onConfirmNickname() {
    const nickname = this.data.tempNickname.trim();

    if (!nickname) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }
    if (nickname.length > 20) {
      wx.showToast({ title: '昵称过长', icon: 'none' });
      return;
    }

    const avatarRaw = this.data.avatarUrl || '';
    const avatar = avatarRaw.startsWith('http') && !avatarRaw.includes('127.0.0.1') && !avatarRaw.includes('localhost')
      ? avatarRaw : '';

    updateProfile(nickname, avatar);
    this.setData({
      nickname,
      showNicknameInput: false,
    });
    wx.showToast({ title: '保存成功', icon: 'success' });
  },

  onCancelNickname() {
    this.setData({ showNicknameInput: false });
  },

  preventTouchMove() {
    return false;
  },

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
            isAgreed: false,
          });
          wx.showToast({ title: '已退出登录', icon: 'success' });
        }
      },
    });
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
