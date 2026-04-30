// 用户信息管理工具（支持微信头像选择器 + 本地存储）
// 核心改进：支持手机号绑定、JWT Token 管理

const USER_INFO_KEY = 'userInfo';
const AUTH_TOKEN_KEY = 'authToken';
const OPENID_KEY = 'savedOpenid';

/**
 * 获取用户信息
 */
export function getUserInfo(): any {
  try {
    const raw = wx.getStorageSync(USER_INFO_KEY);
    if (raw) {
      const info = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return {
        nickname: info.nickname || '',
        avatar: info.avatar || '',
        loginState: info.loginState || false,
        loginTime: info.loginTime || 0,
        phoneNumber: info.phoneNumber || '',
        ...info
      };
    }
  } catch (e) {
    console.error('读取用户信息失败', e);
  }
  return {
    nickname: '',
    avatar: '',
    loginState: false,
    loginTime: 0,
    phoneNumber: ''
  };
}

/**
 * 保存用户信息
 */
export function saveUserInfo(info: any): void {
  try {
    const current = getUserInfo();
    const newInfo = {
      ...current,
      ...info,
      loginState: true,
      loginTime: info.loginTime || Date.now()
    };
    wx.setStorageSync(USER_INFO_KEY, JSON.stringify(newInfo));
  } catch (e) {
    console.error('保存用户信息失败', e);
  }
}

/**
 * 检查是否已登录
 */
export function isLoggedIn(): boolean {
  const info = getUserInfo();
  return info.loginState && !!info.nickname;
}

/**
 * 保存用户自行输入的昵称和选择的头像
 * @param nickname 昵称
 * @param avatar 头像URL
 * @param openid 微信 openid（可选，用于持久化登录）
 */
export function saveUserProfile(nickname: string, avatar: string, openid?: string): any {
  const current = getUserInfo();
  const info: any = {
    nickname: nickname.trim(),
    avatar: avatar,
    loginState: true,
    loginTime: Date.now()
  };

  // 保留原有的 openid，或者使用新传入的 openid
  if (openid) {
    info.openid = openid;
  } else if (current.openid) {
    info.openid = current.openid;
  }

  // 保留手机号
  if (current.phoneNumber) {
    info.phoneNumber = current.phoneNumber;
  }

  saveUserInfo(info);
  return info;
}

/**
 * 设置用户手机号
 */
export function setPhoneNumber(phoneNumber: string): void {
  const current = getUserInfo();
  current.phoneNumber = phoneNumber;
  saveUserInfo(current);
}

/**
 * 获取用户手机号
 */
export function getPhoneNumber(): string {
  const info = getUserInfo();
  return info.phoneNumber || '';
}

/**
 * 获取认证 Token
 */
export function getAuthToken(): string {
  return wx.getStorageSync(AUTH_TOKEN_KEY) || '';
}

/**
 * 设置认证 Token
 */
export function setAuthToken(token: string): void {
  wx.setStorageSync(AUTH_TOKEN_KEY, token);
}

/**
 * 清除认证 Token
 */
export function clearAuthToken(): void {
  wx.removeStorageSync(AUTH_TOKEN_KEY);
}

/**
 * 获取保存的 OpenID
 */
export function getSavedOpenid(): string {
  return wx.getStorageSync(OPENID_KEY) || '';
}

/**
 * 保存 OpenID
 */
export function setSavedOpenid(openid: string): void {
  wx.setStorageSync(OPENID_KEY, openid);
}

/**
 * 退出登录
 */
export function logout(): void {
  try {
    // 清除用户信息，但保留 openid 和 token
    const savedOpenid = getSavedOpenid();
    const savedToken = getAuthToken();
    
    wx.removeStorageSync(USER_INFO_KEY);
    
    // 保留必要信息用于重新登录
    if (savedOpenid) {
      wx.setStorageSync(OPENID_KEY, savedOpenid);
    }
    if (savedToken) {
      wx.setStorageSync(AUTH_TOKEN_KEY, savedToken);
    }
  } catch (e) {
    console.error('退出登录失败', e);
  }
}

/**
 * 获取登录状态文本
 */
export function getLoginStatusText(): string {
  const info = getUserInfo();
  if (!info.loginState) {
    return '点击登录';
  }
  if (!info.nickname) {
    return '点击完善资料';
  }
  return info.nickname;
}

/**
 * 检查是否为正式用户
 */
export function isFormalUser(): boolean {
  const info = getUserInfo();
  return info.loginState && !!info.nickname;
}

/**
 * 获取用户唯一标识
 */
export function getUserIdentifier(): string | null {
  const info = getUserInfo();
  if (!info.loginState) {
    return null;
  }
  return info.openid || null;
}

/**
 * 获取 Openid（用于API调用）
 */
export function getOpenid(): string | null {
  const info = getUserInfo();
  return info.openid || getSavedOpenid() || null;
}

/**
 * 获取用户类型
 * @returns 'user' | 'none'
 */
export function getUserType(): 'user' | 'none' {
  const info = getUserInfo();
  if (!info.loginState || !info.nickname) {
    return 'none';
  }
  return 'user';
}

/**
 * 引导用户登录
 */
export function guideToLogin(callback?: () => void): void {
  wx.showModal({
    title: '提示',
    content: '该功能需要登录后才能使用',
    confirmText: '去登录',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        wx.navigateTo({
          url: '/subpackages/lowfreq/login/index',
          success: () => {
            if (callback) callback();
          }
        });
      }
    }
  });
}
