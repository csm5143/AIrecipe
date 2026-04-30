/**
 * 用户上传菜谱 - HTTP API 调用
 * 直接调用后端服务 API
 */

import { isLoggedIn, getOpenid } from './userAuth';

// API 基础路径
const API_BASE = 'http://localhost:3001/api';

// 类型定义
export type RecipeDifficulty = 'easy' | 'normal' | 'hard';
export type RecipeStatus = 'pending' | 'approved' | 'rejected';

export interface Ingredient {
  name: string;
  amount: string;
}

export interface RecipeStep {
  description: string;
  image?: string;
}

export interface UserRecipe {
  _id: string;
  recipeId: string;
  openid: string;
  nickname: string;
  avatar: string;
  title: string;
  coverImage: string;
  description: string;
  difficulty: RecipeDifficulty;
  cookingTime: number;
  servings: number;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  tips?: string;
  tags: string[];
  mealTimes: string[];
  dishTypes: string[];
  status: RecipeStatus;
  rejectReason?: string;
  viewCount: number;
  likeCount: number;
  createdAt: number;
  updatedAt: number;
  publishedAt?: number;
}

export interface SubmitRecipeParams {
  title: string;
  coverImage: string;
  description: string;
  difficulty: RecipeDifficulty;
  cookingTime: number;
  servings: number;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  tips?: string;
  tags: string[];
  mealTimes: string[];
  dishTypes: string[];
}

// ==================== HTTP 请求封装 ====================

interface ApiResult<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  total?: number;
  hasMore?: boolean;
}

async function request<T = any>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: any;
    headers?: Record<string, string>;
  } = {}
): Promise<ApiResult<T>> {
  const { method = 'GET', data, headers = {} } = options;

  // 获取 openid
  const openid = getOpenid();
  if (openid) {
    headers['x-openid'] = openid;
  }

  // #region debug log hypothesis A
  fetch('http://127.0.0.1:7659/ingest/62624b2e-6afb-4a90-931b-dedcd7320e0a', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '674cb7' },
    body: JSON.stringify({
      sessionId: '674cb7',
      location: 'cloudUserRecipe.ts:request:START',
      message: 'HTTP API request initiating',
      data: { endpoint, method, apiBase: API_BASE },
      runId: 'run1',
      hypothesisId: 'A',
      timestamp: Date.now()
    })
  }).catch(() => {});
  // #endregion

  try {
    const response = await wx.request({
      url: `${API_BASE}${endpoint}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 30000
    });

    // #region debug log hypothesis A
    fetch('http://127.0.0.1:7659/ingest/62624b2e-6afb-4a90-931b-dedcd7320e0a', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '674cb7' },
      body: JSON.stringify({
        sessionId: '674cb7',
        location: 'cloudUserRecipe.ts:request:SUCCESS',
        message: 'HTTP API request succeeded',
        data: { endpoint, statusCode: response.statusCode },
        runId: 'run1',
        hypothesisId: 'A',
        timestamp: Date.now()
      })
    }).catch(() => {});
    // #endregion

    const result = response.data as ApiResult<T>;

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return result;
    } else {
      console.error('[UserRecipe API] 请求失败:', response.statusCode, result);
      return {
        success: false,
        message: result?.message || '网络请求失败'
      };
    }
  } catch (error: any) {
    // #region debug log hypothesis A
    fetch('http://127.0.0.1:7659/ingest/62624b2e-6afb-4a90-931b-dedcd7320e0a', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '674cb7' },
      body: JSON.stringify({
        sessionId: '674cb7',
        location: 'cloudUserRecipe.ts:request:ERROR',
        message: 'HTTP API request failed',
        data: { endpoint, error: error.message, errorType: error.type, errMsg: error.errMsg },
        runId: 'run1',
        hypothesisId: 'A',
        timestamp: Date.now()
      })
    }).catch(() => {});
    // #endregion

    console.error('[UserRecipe API] 请求异常:', error);
    return {
      success: false,
      message: error.message || '网络异常'
    };
  }
}

// ==================== 菜谱操作 ====================

/**
 * 提交用户菜谱
 */
export async function submitRecipe(params: SubmitRecipeParams): Promise<{
  success: boolean;
  message: string;
  recipeId?: string;
}> {
  if (!isLoggedIn()) {
    return { success: false, message: '请先登录' };
  }

  // 验证必填字段
  if (!params.title?.trim()) {
    return { success: false, message: '请输入菜谱标题' };
  }
  if (!params.coverImage) {
    return { success: false, message: '请上传封面图片' };
  }
  if (!params.ingredients || params.ingredients.length === 0) {
    return { success: false, message: '请添加食材' };
  }
  if (!params.steps || params.steps.length === 0) {
    return { success: false, message: '请添加步骤' };
  }

  return request('/user-recipes', {
    method: 'POST',
    data: params
  });
}

/**
 * 获取我的上传列表
 */
export async function getMyRecipes(
  status?: RecipeStatus,
  page: number = 1,
  pageSize: number = 20
): Promise<{
  success: boolean;
  message: string;
  data?: UserRecipe[];
  total?: number;
  hasMore?: boolean;
}> {
  if (!isLoggedIn()) {
    return { success: false, message: '请先登录' };
  }

  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('pageSize', pageSize.toString());
  if (status) {
    params.append('status', status);
  }

  return request('/user-recipes/my?' + params.toString());
}

/**
 * 获取社区菜谱列表
 */
export async function getCommunityRecipes(params: {
  page?: number;
  pageSize?: number;
  mealTime?: string;
} = {}): Promise<{
  success: boolean;
  message: string;
  data?: UserRecipe[];
  total?: number;
  hasMore?: boolean;
}> {
  const queryParams = new URLSearchParams();
  queryParams.append('page', (params.page || 1).toString());
  queryParams.append('pageSize', (params.pageSize || 20).toString());
  if (params.mealTime) {
    queryParams.append('mealTime', params.mealTime);
  }

  return request('/user-recipes/community?' + queryParams.toString());
}

/**
 * 获取菜谱详情
 */
export async function getRecipeDetail(recipeId: string): Promise<{
  success: boolean;
  message: string;
  data?: UserRecipe;
}> {
  return request(`/user-recipes/${recipeId}`);
}

/**
 * 删除我的菜谱
 */
export async function deleteMyRecipe(recipeId: string): Promise<{
  success: boolean;
  message: string;
}> {
  if (!isLoggedIn()) {
    return { success: false, message: '请先登录' };
  }

  return request(`/user-recipes/${recipeId}`, {
    method: 'DELETE'
  });
}

/**
 * 点赞/取消点赞
 */
export async function toggleLike(recipeId: string): Promise<{
  success: boolean;
  message: string;
  liked?: boolean;
  likeCount?: number;
}> {
  if (!isLoggedIn()) {
    return { success: false, message: '请先登录' };
  }

  return request(`/user-recipes/${recipeId}/like`, {
    method: 'POST'
  });
}

/**
 * 检查是否已点赞
 */
export async function checkLiked(recipeId: string): Promise<boolean> {
  if (!isLoggedIn()) {
    return false;
  }

  try {
    const result = await getRecipeDetail(recipeId);
    // 通过本地状态判断，实际应该从服务端获取用户点赞列表
    return false;
  } catch {
    return false;
  }
}

/**
 * 增加浏览量
 */
export async function increaseViewCount(recipeId: string): Promise<void> {
  try {
    await request(`/user-recipes/${recipeId}/view`, {
      method: 'POST'
    });
  } catch (e) {
    console.error('[UserRecipe] 增加浏览量失败', e);
  }
}

// ==================== 选项定义 ====================

export const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: '简单', icon: '🥄' },
  { value: 'normal', label: '中等', icon: '🍳' },
  { value: 'hard', label: '困难', icon: '👨‍🍳' }
];

export const MEAL_TIME_OPTIONS = [
  { value: 'breakfast', label: '早餐' },
  { value: 'lunch', label: '午餐' },
  { value: 'dinner', label: '晚餐' },
  { value: 'late_night', label: '夜宵' }
];

export const DISH_TYPE_OPTIONS = [
  { value: 'stir_fry', label: '炒菜' },
  { value: 'soup', label: '汤品' },
  { value: 'main', label: '主食' },
  { value: 'dessert', label: '甜点' },
  { value: 'drink', label: '饮品' },
  { value: 'salad', label: '凉菜' },
  { value: 'snack', label: '小吃' }
];

export const TAG_OPTIONS = [
  { value: 'home_style', label: '家常菜' },
  { value: 'quick', label: '快手菜' },
  { value: 'healthy', label: '健康' },
  { value: 'vegetarian', label: '素食' },
  { value: 'spicy', label: '麻辣' },
  { value: 'savory', label: '下饭' },
  { value: 'fitness', label: '健身' },
  { value: 'children', label: '儿童' },
  { value: 'soup_stew', label: '炖煮' },
  { value: 'steamed', label: '蒸菜' }
];

export const STATUS_TEXT: Record<RecipeStatus, string> = {
  pending: '审核中',
  approved: '已通过',
  rejected: '已拒绝'
};

export const STATUS_COLOR: Record<RecipeStatus, string> = {
  pending: '#FF9500',
  approved: '#34C759',
  rejected: '#FF3B30'
};
