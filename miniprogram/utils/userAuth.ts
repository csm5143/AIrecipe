// 用户信息管理工具（支持微信头像选择器 + 本地存储）

const USER_INFO_KEY = 'userInfo';

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
    loginTime: 0
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
 * @param isGuest 是否为游客
 * @param openid 微信 openid（可选，用于持久化登录）
 */
export function saveUserProfile(nickname: string, avatar: string, isGuest: boolean = false, openid?: string): any {
  const current = getUserInfo();
  const info: any = {
    nickname: nickname.trim(),
    avatar: avatar,
    loginState: true,
    isGuest,
    loginTime: Date.now()
  };

  // 保留原有的 openid，或者使用新传入的 openid
  if (openid) {
    info.openid = openid;
  } else if (current.openid) {
    info.openid = current.openid;
  }

  saveUserInfo(info);
  return info;
}

/**
 * 退出登录
 */
export function logout(): void {
  try {
    wx.removeStorageSync(USER_INFO_KEY);
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

// 拍照识别次数限制
const SCAN_COUNT_KEY = 'scanCount';

/**
 * 获取用户类型
 * @returns 'user' | 'visitor' | 'none'
 */
export function getUserType(): 'user' | 'visitor' | 'none' {
  const info = getUserInfo();
  if (!info.loginState) {
    return 'none';
  }
  if (info.isGuest === true) {
    return 'visitor';
  }
  return 'user';
}

/**
 * 获取用户唯一标识
 * 正式用户: openid
 * 游客: anonymous_id (本地生成并存储)
 */
export function getUserIdentifier(): string | null {
  const info = getUserInfo();

  if (!info.loginState) {
    return null;
  }

  // 正式用户使用 openid
  if (info.openid) {
    return info.openid;
  }

  // 游客使用匿名ID
  let anonymousId = info.anonymousId;
  if (!anonymousId) {
    anonymousId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
    info.anonymousId = anonymousId;
    wx.setStorageSync(USER_INFO_KEY, JSON.stringify(info));
  }

  return anonymousId;
}
const SCAN_COUNT_RESET_HOURS = 24; // 24小时后重置次数
const MAX_SCAN_COUNT = 3; // 每天最多3次

/**
 * 检查是否为正式用户（未登录或游客都不算正式用户）
 */
export function isFormalUser(): boolean {
  const info = getUserInfo();
  return info.loginState && !!info.nickname && info.isGuest !== true;
}

/**
 * 获取当天剩余拍照次数
 */
export function getRemainingScanCount(): number {
  try {
    const data = wx.getStorageSync(SCAN_COUNT_KEY);
    if (!data) return MAX_SCAN_COUNT;

    const { count, date } = typeof data === 'string' ? JSON.parse(data) : data;
    const today = getDateString();

    // 新的一天，重置次数
    if (date !== today) {
      return MAX_SCAN_COUNT;
    }

    return Math.max(0, MAX_SCAN_COUNT - count);
  } catch (e) {
    return MAX_SCAN_COUNT;
  }
}

/**
 * 消耗一次拍照次数
 */
export function consumeScanCount(): boolean {
  try {
    const data = wx.getStorageSync(SCAN_COUNT_KEY);
    const today = getDateString();

    let currentCount = 0;

    if (data) {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      // 新的一天，重置次数
      if (parsed.date === today) {
        currentCount = parsed.count || 0;
      }
    }

    // 检查是否已达上限
    if (currentCount >= MAX_SCAN_COUNT) {
      return false;
    }

    // 保存新的计数
    wx.setStorageSync(SCAN_COUNT_KEY, {
      count: currentCount + 1,
      date: today
    });

    return true;
  } catch (e) {
    console.error('更新拍照次数失败', e);
    return true; // 出错时放行
  }
}

/**
 * 获取拍照次数重置时间（次日凌晨）
 */
export function getScanCountResetTime(): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

/**
 * 获取当前日期字符串 (YYYY-MM-DD)
 */
function getDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 检查是否可以使用拍照功能（游客限制次数，正式用户不限）
 * 返回 { canUse: boolean, isGuest: boolean }
 */
export function checkScanAccess(): { canUse: boolean; isGuest: boolean } {
  // 正式用户直接通过
  if (isFormalUser()) {
    return { canUse: true, isGuest: false };
  }

  // 游客检查剩余次数
  const remaining = getRemainingScanCount();
  if (remaining <= 0) {
    return { canUse: false, isGuest: true };
  }

  return { canUse: true, isGuest: true };
}

/**
 * 消耗一次拍照次数（仅游客需要消耗）
 * 返回是否成功消耗
 */
export function consumeScanCountIfNeeded(): boolean {
  // 只有非正式用户才需要消耗次数
  if (isFormalUser()) {
    return true;
  }
  return consumeScanCount();
}

/**
 * 获取剩余拍照次数（仅游客/未登录用户有意义的显示）
 */
export function getDisplayRemainingCount(): number {
  if (isFormalUser()) {
    return -1; // 正式用户返回 -1，表示不显示
  }
  return getRemainingScanCount();
}

/**
 * 引导用户登录（正式用户）
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
