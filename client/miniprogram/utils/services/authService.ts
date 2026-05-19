/**
 * 认证服务 - 统一的登录、会话恢复、登出逻辑
 * 整合 authStorage + wxLogin API，作为小程序唯一的认证层
 */
import { wxLogin as wxLoginApi, restoreSession as restoreSessionApi, getUserProfile } from '../httpApi/auth';
import {
  saveWxToken,
  saveOpenid,
  clearWxToken,
  clearOpenid,
  saveUserInfo,
  getUserInfo,
  logout as clearStorage,
  isLoggedIn as storageIsLoggedIn,
  getWxToken,
  getSavedOpenid,
} from '../httpApi/authStorage';

/** 登录结果 */
export interface LoginResult {
  success: boolean;
  isNewUser?: boolean;
  error?: string;
}

/**
 * 引导用户登录（如未登录则跳转登录页）
 */
export function requireAuth(callback?: () => void, failCallback?: () => void): void {
  if (storageIsLoggedIn()) {
    if (callback) callback();
    return;
  }
  if (failCallback) {
    failCallback();
  } else {
    wx.navigateTo({
      url: '/subpackages/lowfreq/login/index',
    });
  }
}

/**
 * 检查登录状态
 */
export function isLoggedIn(): boolean {
  return storageIsLoggedIn();
}

/**
 * 恢复登录会话（后台静默）
 * 供 app.ts 在 onLaunch 时调用
 */
export async function restoreSession(): Promise<boolean> {
  if (!getSavedOpenid()) return false;
  try {
    const result = await restoreSessionApi();
    return result.loggedIn;
  } catch {
    return false;
  }
}

/**
 * 完整的微信登录流程
 * @param wxUserInfo 微信用户信息（昵称、头像）
 */
export async function login(wxUserInfo?: {
  nickName?: string;
  avatarUrl?: string;
}): Promise<LoginResult> {
  // 1. 获取微信 code
  const loginResult = await new Promise<{ code: string }>((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (res.code) {
          resolve({ code: res.code });
        } else {
          reject(new Error('未获取到微信登录凭证'));
        }
      },
      fail: (err) => reject(err),
    });
  });

  // 2. 调用后端登录接口
  const res = await wxLoginApi(loginResult.code, wxUserInfo);
  if (!res.success || !res.data) {
    return { success: false, error: res.message || '登录失败' };
  }

  const { token, openid } = res.data;

  // 3. 保存 token 和 openid
  saveWxToken(token);
  saveOpenid(openid);

  // 4. 从数据库获取最新用户信息（包含注册时保存的昵称和头像）
  let finalNickname = wxUserInfo?.nickName || '';
  let finalAvatar = wxUserInfo?.avatarUrl || '';
  try {
    const profile = await getUserProfile();
    if (profile.success && profile.data) {
      finalNickname = profile.data.nickname || finalNickname;
      finalAvatar = profile.data.avatar || finalAvatar;
    }
  } catch (e) {
    console.warn('[AuthService] 获取用户资料失败，使用本地信息', e);
  }

  // 5. 保存用户信息
  saveUserInfo({
    openid,
    nickname: finalNickname,
    avatar: finalAvatar,
    loginState: true,
    loginTime: Date.now(),
  });

  return { success: true, isNewUser: false };
}

/**
 * 登出（保留 openid 用于快速重新登录）
 */
export function logout(): void {
  // 保留 openid 用于重新登录，保留 token 用于静默续期
  const savedOpenid = getSavedOpenid();
  const savedToken = getWxToken();

  clearStorage(); // 清除 userInfo

  if (savedOpenid) saveOpenid(savedOpenid);
  if (savedToken) saveWxToken(savedToken);
}

/**
 * 更新本地昵称/头像
 */
export function updateProfile(nickname: string, avatar: string): void {
  const current = getUserInfo() || {};
  saveUserInfo({
    ...current,
    nickname,
    avatar,
    loginState: true,
    loginTime: Date.now(),
  });
}

/**
 * 获取当前用户信息
 */
export function getCurrentUser(): any {
  return getUserInfo();
}

/** 统一导出的 authService 对象 */
export const authService = {
  requireAuth,
  isLoggedIn,
  restoreSession,
  login,
  logout,
  updateProfile,
  getCurrentUser,
};
