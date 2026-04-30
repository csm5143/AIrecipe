/**
 * 云端用户数据管理
 * 存储用户数据到云数据库
 * 环境 ID: cloud1-3gyq7jzx76f46edc
 */

// 云数据库集合名称
const USERS_COLLECTION = 'users';

// 缓存配置
const CACHE_KEY_USER_DATA = 'cloud_user_data';
const CACHE_EXPIRE_MINUTES = 30; // 缓存30分钟

// ==================== 类型定义 ====================

export interface UserCloudData {
  identifier: string;           // 用户唯一标识
  userType: 'user';            // 用户类型
  createdAt: number;           // 创建时间
  updatedAt: number;           // 更新时间
  
  // 收藏数据
  favorites?: string[];
  
  // 小菜篮数据
  basket?: BasketData;
  
  // 健身目标
  fitnessGoal?: FitnessGoal;
  
  // 儿童信息
  childrenStage?: ChildrenStage;
  
  // 用户头像
  avatar?: string;
  
  // 用户昵称
  nickname?: string;
}

export interface BasketData {
  entries: Array<{
    recipeId: string;
    recipeName: string;
    ingredients: Array<{
      name: string;
      amount: string;
    }>;
  }>;
}

export interface FitnessGoal {
  goal: 'lose' | 'keep' | 'gain';
  targetWeight?: number;
  currentWeight?: number;
}

export interface ChildrenStage {
  stage: string;
  age?: string;
}

// ==================== 工具函数 ====================

/**
 * 获取用户信息
 */
function getUserInfo(): any {
  try {
    const raw = wx.getStorageSync('userInfo');
    if (raw) {
      const info = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return {
        nickname: info.nickname || '',
        avatar: info.avatar || '',
        loginState: info.loginState || false,
        loginTime: info.loginTime || 0,
        openid: info.openid || '',
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
    openid: ''
  };
}

/**
 * 保存用户信息
 */
function saveUserInfo(info: any): void {
  try {
    const current = getUserInfo();
    const newInfo = {
      ...current,
      ...info,
      loginState: info.loginState !== undefined ? info.loginState : current.loginState,
      loginTime: info.loginTime || current.loginTime || Date.now()
    };
    wx.setStorageSync('userInfo', JSON.stringify(newInfo));
  } catch (e) {
    console.error('保存用户信息失败', e);
  }
}

/**
 * 检查是否为正式用户
 */
function isFormalUser(): boolean {
  const info = getUserInfo();
  return info.loginState && !!info.nickname;
}

/**
 * 检查云开发是否可用
 */
function isCloudAvailable(): boolean {
  try {
    return !!(wx.cloud && typeof wx.cloud.init === 'function');
  } catch (e) {
    return false;
  }
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
 * 获取用户唯一标识（openid）
 */
export function getUserIdentifier(): string | null {
  const info = getUserInfo();
  
  if (!info.loginState) {
    return null;
  }
  
  return info.openid || null;
}

// ==================== 用户数据操作 ====================

/**
 * 保存用户数据到云端
 * @param data 要保存的用户数据
 */
export async function saveUserDataToCloud(data: UserCloudData): Promise<boolean> {
  if (!isCloudAvailable()) {
    console.warn('[CloudUserData] 云开发不可用');
    return false;
  }

  const identifier = getUserIdentifier();
  if (!identifier) {
    console.warn('[CloudUserData] 用户未登录，无法保存');
    return false;
  }

  try {
    const db = wx.cloud.database();
    const now = Date.now();

    // 构建要保存的数据
    const cloudData: UserCloudData = {
      ...data,
      identifier: identifier,
      userType: 'user',
      updatedAt: now,
      createdAt: data.createdAt || now
    };

    // 查询是否已存在记录
    const existResult = await db.collection(USERS_COLLECTION)
      .where({ identifier: identifier })
      .limit(1)
      .get();

    if (existResult.data && existResult.data.length > 0) {
      // 更新现有记录
      const recordId = existResult.data[0]._id;
      await db.collection(USERS_COLLECTION)
        .doc(recordId)
        .update({
          data: cloudData
        });
      console.log('[CloudUserData] 用户数据已更新到云端');
    } else {
      // 新增记录
      await db.collection(USERS_COLLECTION)
        .add({
          data: cloudData
        });
      console.log('[CloudUserData] 用户数据已新增到云端');
    }

    // 更新本地缓存
    saveToLocalCache(cloudData);
    
    return true;
  } catch (e) {
    console.error('[CloudUserData] 保存用户数据失败', e);
    return false;
  }
}

/**
 * 从云端获取用户数据
 */
export async function getUserDataFromCloud(): Promise<UserCloudData | null> {
  if (!isCloudAvailable()) {
    console.warn('[CloudUserData] 云开发不可用');
    return null;
  }

  const identifier = getUserIdentifier();
  if (!identifier) {
    return null;
  }

  const userType = getUserType();
  if (userType === 'none') {
    return null;
  }

  // 先检查本地缓存
  const cached = getFromLocalCache();
  if (cached) {
    return cached;
  }

  try {
    const db = wx.cloud.database();
    const result = await db.collection(USERS_COLLECTION)
      .where({ identifier: identifier })
      .limit(1)
      .get();

    if (result.data && result.data.length > 0) {
      const data = result.data[0] as UserCloudData;
      // 存入本地缓存
      saveToLocalCache(data);
      return data;
    }

    return null;
  } catch (e) {
    console.error('[CloudUserData] 获取用户数据失败', e);
    return null;
  }
}

/**
 * 获取云端用户数据的别名（兼容旧代码）
 */
export const getUserCloudData = getUserDataFromCloud;

/**
 * 更新用户的收藏列表到云端
 */
export async function syncFavoritesToCloud(favoriteIds: string[]): Promise<boolean> {
  const userData: Partial<UserCloudData> = {
    favorites: favoriteIds
  };
  return await saveUserDataToCloud(userData as UserCloudData);
}

/**
 * 更新用户的小菜篮数据到云端
 */
export async function syncBasketToCloud(basketData: BasketData): Promise<boolean> {
  const userData: Partial<UserCloudData> = {
    basket: basketData
  };
  return await saveUserDataToCloud(userData as UserCloudData);
}

/**
 * 更新用户的健身目标到云端
 */
export async function syncFitnessGoalToCloud(goal: FitnessGoal): Promise<boolean> {
  const userData: Partial<UserCloudData> = {
    fitnessGoal: goal
  };
  return await saveUserDataToCloud(userData as UserCloudData);
}

/**
 * 更新用户的儿童信息到云端
 */
export async function syncChildrenInfoToCloud(stage: ChildrenStage): Promise<boolean> {
  const userData: Partial<UserCloudData> = {
    childrenStage: stage
  };
  return await saveUserDataToCloud(userData as UserCloudData);
}

/**
 * 合并云端数据到本地（用于数据恢复）
 */
export async function mergeCloudDataToLocal(): Promise<boolean> {
  const cloudData = await getUserDataFromCloud();
  if (!cloudData) {
    return false;
  }
  return restoreLocalData(cloudData);
}

/**
 * 将云端数据恢复到本地存储
 * @param cloudData 云端数据
 * @returns 是否恢复成功
 */
export function restoreLocalData(cloudData: UserCloudData): boolean {
  try {
    // 恢复收藏列表（旧版）
    if (cloudData.favorites && Array.isArray(cloudData.favorites)) {
      wx.setStorageSync('favoriteRecipes', JSON.stringify(cloudData.favorites));
    }

    // 恢复小菜篮
    if (cloudData.basket) {
      wx.setStorageSync('littleBasketV2', JSON.stringify(cloudData.basket.entries || []));
    }

    // 恢复健身目标
    if (cloudData.fitnessGoal) {
      wx.setStorageSync('fitnessGoal', JSON.stringify(cloudData.fitnessGoal));
    }

    // 恢复儿童信息
    if (cloudData.childrenStage) {
      wx.setStorageSync('childrenStage', JSON.stringify(cloudData.childrenStage));
    }

    // 恢复昵称和头像
    if (cloudData.nickname || cloudData.avatar) {
      const currentUserInfo = wx.getStorageSync('userInfo');
      const userInfo = currentUserInfo ? JSON.parse(currentUserInfo) : {};
      if (cloudData.nickname) userInfo.nickname = cloudData.nickname;
      if (cloudData.avatar) userInfo.avatar = cloudData.avatar;
      wx.setStorageSync('userInfo', JSON.stringify(userInfo));
    }

    console.log('[CloudUserData] 旧版云端数据已恢复到本地');
    return true;
  } catch (e) {
    console.error('[CloudUserData] 恢复本地数据失败', e);
    return false;
  }
}

// ==================== 本地缓存操作 ====================

function saveToLocalCache(data: UserCloudData): void {
  const cacheData = {
    data: data,
    timestamp: Date.now()
  };
  try {
    wx.setStorageSync(CACHE_KEY_USER_DATA, JSON.stringify(cacheData));
  } catch (e) {
    console.warn('[CloudUserData] 保存本地缓存失败', e);
  }
}

function getFromLocalCache(): UserCloudData | null {
  try {
    const raw = wx.getStorageSync(CACHE_KEY_USER_DATA);
    if (!raw) return null;
    
    const cache = JSON.parse(raw);
    const now = Date.now();
    const cacheAge = (now - cache.timestamp) / 1000 / 60; // 分钟
    
    // 缓存超过30分钟，视为过期
    if (cacheAge > CACHE_EXPIRE_MINUTES) {
      wx.removeStorageSync(CACHE_KEY_USER_DATA);
      return null;
    }
    
    return cache.data as UserCloudData;
  } catch (e) {
    return null;
  }
}

/**
 * 清除本地用户数据缓存
 */
export function clearUserDataCache(): void {
  try {
    wx.removeStorageSync(CACHE_KEY_USER_DATA);
  } catch (e) {
    console.warn('[CloudUserData] 清除缓存失败', e);
  }
}
