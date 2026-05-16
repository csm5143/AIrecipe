// 登录页面：微信一键登录（HTTP 版，移除云开发依赖）

import {
  getUserInfo,
  saveUserProfile,
  logout
} from '../../../utils/userAuth';

interface LoginResult {
  success: boolean;
  openid?: string;
  unionid?: string;
  isNewUser?: boolean;
  token?: string;
  error?: string;
}

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
    const info = getUserInfo();
    const hasLogin = info.loginState && !!info.nickname;

    this.setData({
      userInfo: info,
      hasLogin,
      nickname: info.nickname || '',
      avatarUrl: info.avatar || '',
    });
  },

  // 切换用户协议勾选状态
  onToggleAgreement() {
    this.setData({
      isAgreed: !this.data.isAgreed,
    });
  },

  // 选择头像（本地保存，不上传云端）
  onChooseAvatar(e: any) {
    const avatarUrl = e.detail.avatarUrl;
    this.setData({ avatarUrl });

    const nickname = this.data.tempNickname || this.data.nickname;
    if (nickname) {
      const info = saveUserProfile(nickname, avatarUrl);
      this.setData({
        userInfo: info,
        hasLogin: true,
      });
      wx.showToast({ title: '头像已更新', icon: 'success' });
    }
  },

  // 输入昵称
  onNicknameInput(e: any) {
    this.setData({
      tempNickname: e.detail.value,
    });
  },

  // 清空昵称
  onClearNickname() {
    this.setData({
      tempNickname: '',
    });
  },

  // 微信一键登录（HTTP 版本）
  async onWechatLogin() {
    if (!this.data.isAgreed) {
      wx.showToast({
        title: '请阅读并勾选用户协议',
        icon: 'none',
        duration: 2000,
      });
      return;
    }

    this.setData({ loginLoading: true });
    wx.showLoading({ title: '登录中...', mask: true });

    try {
      // 1. 获取微信登录凭证 code
      const loginResult = await this.wxLogin();
      if (!loginResult.code) {
        throw new Error('微信登录失败');
      }

      // 2. 调用后端 HTTP API 进行登录
      const res = await this.httpLogin(loginResult.code);
      if (!res.success) {
        throw new Error(res.error || '登录失败');
      }

      const { openid, token, isNewUser } = res;

      // 3. 保存用户信息
      const nickname = this.data.tempNickname.trim() || this.data.nickname;
      const avatarRaw = this.data.avatarUrl || '';
      const avatar = avatarRaw.startsWith('http') && !avatarRaw.includes('127.0.0.1') && !avatarRaw.includes('localhost') ? avatarRaw : '';
      const finalNickname = nickname || '美食家' + Math.floor(Math.random() * 9000 + 1000);

      const info = saveUserProfile(finalNickname, avatar, openid);

      // 保存 token 和 openid
      if (openid) wx.setStorageSync('savedOpenid', openid);
      if (token) wx.setStorageSync('authToken', token);

      wx.hideLoading();
      this.setData({ loginLoading: false });

      wx.showToast({
        title: isNewUser ? '注册成功' : '登录成功',
        icon: 'success',
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 1500);

    } catch (err: any) {
      console.error('[Login] 微信登录失败', err);
      wx.hideLoading();
      this.setData({ loginLoading: false });
      wx.showToast({
        title: err.message || '登录失败，请重试',
        icon: 'none',
      });
    }
  },

  // 调用后端登录接口
  httpLogin(code: string): Promise<{
    success: boolean;
    openid?: string;
    token?: string;
    isNewUser?: boolean;
    error?: string;
  }> {
    return new Promise((resolve) => {
      wx.request({
        url: 'http://localhost:3000/v1/wx/login',
        method: 'POST',
        data: { code },
        header: { 'Content-Type': 'application/json' },
        timeout: 15000,
        success: (res: any) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const body = res.data;
            if (body.success && body.data) {
              resolve({
                success: true,
                openid: body.data.openid,
                token: body.data.token,
                isNewUser: body.data.isNewUser || false,
              });
            } else {
              resolve({ success: false, error: body.message || '登录失败' });
            }
          } else {
            resolve({ success: false, error: '服务器错误 (' + res.statusCode + ')' });
          }
        },
        fail: () => {
          resolve({ success: false, error: '网络异常，请检查网络连接' });
        },
      });
    });
  },

  // 微信登录获取 code
  wxLogin(): Promise<{ code: string; errMsg: string }> {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (res.code) {
            resolve({ code: res.code, errMsg: res.errMsg });
          } else {
            reject(new Error('未获取到登录凭证'));
          }
        },
        fail: (err) => {
          reject(err);
        },
      });
    });
  },

  // 显示昵称输入框
  onShowNicknameInput() {
    this.setData({
      showNicknameInput: true,
      tempNickname: this.data.nickname || '',
    });
  },

  // 确认保存昵称
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
    const avatar = avatarRaw.startsWith('http') && !avatarRaw.includes('127.0.0.1') && !avatarRaw.includes('localhost') ? avatarRaw : '';

    const info = saveUserProfile(nickname, avatar);
    this.setData({
      userInfo: info,
      nickname: info.nickname,
      showNicknameInput: false,
    });

    wx.showToast({ title: '保存成功', icon: 'success' });
  },

  // 取消编辑昵称
  onCancelNickname() {
    this.setData({ showNicknameInput: false });
  },

  // 阻止默认事件
  preventTouchMove() {
    return false;
  },

  // 退出登录
  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          const info = getUserInfo();
          const savedOpenid = info.openid || '';
          const savedToken = wx.getStorageSync('authToken');

          logout();

          if (savedOpenid) wx.setStorageSync('savedOpenid', savedOpenid);
          if (savedToken) wx.setStorageSync('authToken', savedToken);

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

  // 查看用户协议
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

  // 查看隐私政策
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
