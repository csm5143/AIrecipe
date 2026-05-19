/**
 * 用户数据云同步（stub - 云开发已移除）
 * 保留接口签名，本地数据通过 localStorage 管理
 */

export interface UserCloudData {
  openid?: string;
  nickname?: string;
  avatar?: string;
  phone?: string;
  favorites?: string[];
  basket?: any;
  fitnessGoal?: any;
  childrenStage?: any;
  updatedAt?: number;
}

/** 获取云端用户数据（stub） */
export async function getUserDataFromCloud(): Promise<UserCloudData | null> {
  console.warn('[cloudUserData] 云开发已移除，使用本地存储');
  return null;
}

/** 恢复云端数据到本地（stub） */
export function restoreLocalData(_data: UserCloudData): void {
  console.warn('[cloudUserData] 云开发已移除');
}

/** 获取用户 openid（stub） */
export function getUserOpenid(): string | null {
  return wx.getStorageSync('savedOpenid') || null;
}

/** 保存用户数据到云端（stub） */
export async function saveUserDataToCloud(_data: UserCloudData): Promise<boolean> {
  console.warn('[cloudUserData] 云开发已移除，跳过保存');
  return false;
}

/** 合并云端数据到本地（stub） */
export async function mergeCloudDataToLocal(): Promise<boolean> {
  console.warn('[cloudUserData] 云开发已移除，跳过合并');
  return false;
}

/** 清除用户数据缓存（stub） */
export function clearUserDataCache(): void {
  console.warn('[cloudUserData] 云开发已移除，无缓存可清除');
}
