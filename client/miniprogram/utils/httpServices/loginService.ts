/**
 * 登录服务 - 微信登录流程（使用后端 API）
 * 替换 wx.cloud 云函数登录方式
 */

import * as authApi from '../httpApi/auth';
import * as authStorage from '../httpApi/authStorage';

export interface LoginResult {
  success: boolean;
  message: string;
  data?: {
    token: string;
    openid: string;
    userId: number;
    nickname: string | null;
    avatar: string | null;
    hasPhone: boolean;
  };
}

/** 微信静默登录（获取 code） */
function wxCodeLogin(): Promise<string> {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (res.code) resolve(res.code);
        else reject(new Error('获取 code 失败'));
      },
      fail: reject,
    });
  });
}

/**
 * 完整登录流程：
 * 1. wx.login() 获取 code
 * 2. 调用后端 /api/v1/wx/login 换取 token
 * 3. 保存 token 和 openid
 */
export async function login(userInfo?: {
  nickName?: string;
  avatarUrl?: string;
  gender?: number;
}): Promise<LoginResult> {
  try {
    const code = await wxCodeLogin();
    const result = await authApi.wxLogin(code, userInfo);
    if (result.success && result.data) {
      return { success: true, message: '登录成功', data: result.data };
    }
    return { success: false, message: result.message || '登录失败' };
  } catch (error: any) {
    console.error('[LoginService] 登录失败', error);
    return { success: false, message: error.message || '网络异常，请重试' };
  }
}

/** 静默登录（仅检查恢复会话） */
export async function silentLogin(): Promise<{ loggedIn: boolean; openid?: string; userId?: number }> {
  const savedOpenid = authStorage.getSavedOpenid();
  if (!savedOpenid) return { loggedIn: false };
  return authApi.restoreSession();
}

/** 是否已登录 */
export function isLoggedIn(): boolean {
  return authStorage.isLoggedIn();
}

/** 退出登录 */
export function logout(): void {
  authStorage.logout();
  authStorage.clearWxToken();
}

/** 获取当前 openid */
export function getOpenid(): string | null {
  return authStorage.getOpenid();
}

/** 获取用户信息 */
export function getUserInfo(): any {
  return authStorage.getUserInfo();
}

/** 引导用户去登录页面 */
export function guideToLogin(): void {
  wx.showModal({
    title: '提示',
    content: '该功能需要登录后才能使用',
    confirmText: '去登录',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        wx.navigateTo({ url: '/subpackages/lowfreq/login/index' });
      }
    },
  });
}
