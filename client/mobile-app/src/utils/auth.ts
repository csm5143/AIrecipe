/**
 * 认证相关工具函数
 */

// Token 存储键
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_INFO_KEY = 'user_info';

/**
 * 获取 Token
 */
export function getToken(): string | null {
  return uni.getStorageSync(TOKEN_KEY);
}

/**
 * 设置 Token
 */
export function setToken(token: string): void {
  uni.setStorageSync(TOKEN_KEY, token);
}

/**
 * 获取 Refresh Token
 */
export function getRefreshToken(): string | null {
  return uni.getStorageSync(REFRESH_TOKEN_KEY);
}

/**
 * 设置 Refresh Token
 */
export function setRefreshToken(token: string): void {
  uni.setStorageSync(REFRESH_TOKEN_KEY, token);
}

/**
 * 清除所有认证信息
 */
export function clearToken(): void {
  uni.removeStorageSync(TOKEN_KEY);
  uni.removeStorageSync(REFRESH_TOKEN_KEY);
  uni.removeStorageSync(USER_INFO_KEY);
}

/**
 * 获取用户信息
 */
export function getUserInfo(): any {
  try {
    const info = uni.getStorageSync(USER_INFO_KEY);
    return info ? JSON.parse(info) : null;
  } catch {
    return null;
  }
}

/**
 * 设置用户信息
 */
export function setUserInfo(userInfo: any): void {
  uni.setStorageSync(USER_INFO_KEY, JSON.stringify(userInfo));
}

/**
 * 检查是否已登录
 */
export function isLoggedIn(): boolean {
  const token = getToken();
  return !!token;
}

/**
 * 保存登录信息
 */
export function saveLoginData(data: { token: string; refreshToken: string; user: any }): void {
  setToken(data.token);
  setRefreshToken(data.refreshToken);
  setUserInfo(data.user);
}
