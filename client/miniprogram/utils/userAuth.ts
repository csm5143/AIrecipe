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
 * 是否为正式用户（stub - 云开发已移除）
 * 原逻辑：通过微信云开发判断是否绑定手机/正式注册
 * 现在：只要本地有用户信息就视为正式用户
 */
export function isFormalUser(): boolean {
  return isLoggedIn();
}
