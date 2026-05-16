/**
 * 认证 API - 微信登录、JWT Token 管理
 * 对接后端 /v1/wx/*
 */

import { post, get } from './request';
import { saveWxToken, saveOpenid, getSavedOpenid, saveUserInfo } from './authStorage';

export interface WxLoginResult {
  token: string;
  openid: string;
  userId: number;
  nickname: string | null;
  avatar: string | null;
  hasPhone: boolean;
}

export interface UserProfile {
  id: number;
  openid: string;
  nickname: string | null;
  avatar: string | null;
  phone: string | null;
  gender: string;
  createdAt: string;
}

/**
 * 微信登录
 * @param code 微信 login 返回的 code
 * @param userInfo 微信用户信息
 */
export async function wxLogin(code: string, userInfo?: {
  nickName?: string;
  avatarUrl?: string;
  gender?: number;
}): Promise<{ success: boolean; message: string; data?: WxLoginResult }> {
  const res = await post<WxLoginResult>('/v1/wx/login', { code, userInfo });

  if (res.success && res.data) {
    // 保存 token 和 openid
    saveWxToken(res.data.token);
    saveOpenid(res.data.openid);

    // 保存用户信息
    saveUserInfo({
      openid: res.data.openid,
      nickname: res.data.nickname || '',
      avatar: res.data.avatar || '',
      loginState: true,
      loginTime: Date.now(),
    });
  }

  return {
    success: res.success,
    message: res.message || (res.success ? '登录成功' : '登录失败'),
    data: res.data,
  };
}

/**
 * 获取当前用户资料
 */
export async function getUserProfile(): Promise<{ success: boolean; data?: UserProfile }> {
  const res = await get<UserProfile>('/v1/wx/userinfo');
  return { success: res.success, data: res.data };
}

/**
 * 更新用户昵称/头像
 */
export async function updateUserProfile(params: {
  nickname?: string;
  avatar?: string;
}): Promise<{ success: boolean; message: string }> {
  const res = await post('/v1/wx/profile', params);
  return { success: res.success, message: res.message || '' };
}

/**
 * 绑定手机号
 */
export async function bindPhone(phone: string, code?: string): Promise<{ success: boolean; message: string }> {
  const res = await post('/v1/wx/bind-phone', { phone, code });
  return { success: res.success, message: res.message || '' };
}

/**
 * 检查登录状态并恢复
 */
export async function restoreSession(): Promise<{
  loggedIn: boolean;
  openid?: string;
  userId?: number;
}> {
  const savedOpenid = getSavedOpenid();
  if (!savedOpenid) {
    return { loggedIn: false };
  }

  try {
    const res = await getUserProfile();
    if (res.success && res.data) {
      return {
        loggedIn: true,
        openid: res.data.openid,
        userId: res.data.id,
      };
    }
  } catch (e) {
    console.warn('[AuthAPI] 恢复会话失败', e);
  }

  return { loggedIn: false };
}
