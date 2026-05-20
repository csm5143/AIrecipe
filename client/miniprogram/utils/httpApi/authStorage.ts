/**
 * 认证存储层 - 微信登录态持久化管理
 */

const AUTH_TOKEN_KEY = 'wxAuthToken';
const OPENID_KEY = 'savedOpenid';

/** 获取 JWT token */
export function getWxToken(): string {
  try {
    return wx.getStorageSync(AUTH_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

/** 保存 JWT token */
export function saveWxToken(token: string): void {
  wx.setStorageSync(AUTH_TOKEN_KEY, token);
}

/** 清除 JWT token */
export function clearWxToken(): void {
  wx.removeStorageSync(AUTH_TOKEN_KEY);
}

/** 获取保存的 openid */
export function getSavedOpenid(): string {
  try {
    return wx.getStorageSync(OPENID_KEY) || '';
  } catch {
    return '';
  }
}

/** 保存 openid */
export function saveOpenid(openid: string): void {
  wx.setStorageSync(OPENID_KEY, openid);
}

/** 清除 openid */
export function clearOpenid(): void {
  wx.removeStorageSync(OPENID_KEY);
}

/** 获取用户信息（通用存储） */
export function getUserInfo(): any {
  try {
    const raw = wx.getStorageSync('userInfo');
    if (!raw) return null;
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
}

/** 保存用户信息 */
export function saveUserInfo(info: any): void {
  wx.setStorageSync('userInfo', JSON.stringify(info));
}

/** 获取 openid（供其他模块使用） */
export function getOpenid(): string | null {
  return getSavedOpenid() || null;
}

/** 是否已登录（以 token 是否存在为依据，nickname 为空可在登录后补充） */
export function isLoggedIn(): boolean {
  const info = getUserInfo();
  return !!(info && info.loginState);
}

/** 退出登录 */
export function logout(): void {
  wx.removeStorageSync('userInfo');
}
