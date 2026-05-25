/**
 * 用户认证模块（云开发已移除）
 * 统一提供用户状态查询接口
 */
import { getUserInfo as storageGetUserInfo, isLoggedIn } from './httpApi/authStorage.js';

export interface UserInfo {
  loginState: boolean;
  nickname?: string;
  avatar?: string;
  phone?: string;
  [key: string]: any;
}

/**
 * 获取当前用户信息
 */
export function getUserInfo(): UserInfo {
  const info = storageGetUserInfo();
  if (!info) {
    return { loginState: false };
  }
  return {
    loginState: isLoggedIn(),
    nickname: info.nickname,
    avatar: info.avatar,
    phone: info.phone,
    ...info,
  };
}

/**
 * 是否为正式用户
 * 已登录 + 已绑定手机号
 */
export function isFormalUser(): boolean {
  if (!isLoggedIn()) return false;
  const info = storageGetUserInfo();
  return !!(info && info.phone);
}
