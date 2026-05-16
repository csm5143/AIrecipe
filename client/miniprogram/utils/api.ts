// API 配置和请求工具
// 用于连接后端 Admin API 服务
// 迁移自微信云开发，使用自建后端 API

// ==================== API 配置 ====================
// TODO: 部署时修改为实际的后端服务地址
const API_BASE_URL = 'http://localhost:3000';  // 后端服务地址

const API_PREFIX = '/api/v1';  // API 版本前缀

// 构建完整 API 地址
const getFullUrl = (path: string): string => {
  return `${API_BASE_URL}${API_PREFIX}${path}`;
};

// ==================== 请求工具 ====================

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  header?: Record<string, string>;
  timeout?: number;
}

interface RequestResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: number;
}

/**
 * 通用请求封装
 */
function request<T = any>(url: string, options: RequestOptions = {}): Promise<RequestResult<T>> {
  return new Promise((resolve) => {
    const { method = 'GET', data, header = {}, timeout = 10000 } = options;

    // 添加 token 到请求头
    const token = wx.getStorageSync('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...header,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    wx.request({
      url: getFullUrl(url),
      method,
      data,
      header: headers,
      timeout,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const data = res.data as any;
          if (data.code === 0 || data.code === 200) {
            resolve({ success: true, data: data.data, code: data.code });
          } else {
            resolve({ success: false, error: data.message || '请求失败', code: data.code });
          }
        } else {
          // 处理 401 未授权
          if (res.statusCode === 401) {
            wx.removeStorageSync('token');
            wx.showToast({ title: '请重新登录', icon: 'none' });
          }
          resolve({ success: false, error: `请求失败 (${res.statusCode})`, code: res.statusCode });
        }
      },
      fail: (err) => {
        console.error('[API] 请求失败:', err);
        resolve({ success: false, error: err.errMsg || '网络请求失败' });
      },
    });
  });
}

// ==================== 菜谱 API ====================

export const recipeApi = {
  // 获取食谱列表
  getList: (params?: {
    page?: number;
    pageSize?: number;
    category?: string;
    dishType?: string;
    mealTime?: string;
    fitnessMeal?: boolean;
    childrenMeal?: boolean;
    keyword?: string;
  }) => request<{ list: any[]; total: number }>('/app/recipes', {
    method: 'GET',
    data: params,
  }),

  // 获取食谱详情
  getDetail: (id: string) => request<any>('/app/recipes/' + id, {
    method: 'GET',
  }),

  // 获取推荐食谱
  getFeatured: (limit?: number) => request<any[]>('/app/recipes/featured', {
    method: 'GET',
    data: { limit },
  }),

  // 获取分类列表
  getCategories: () => request<any[]>('/app/recipes/categories', {
    method: 'GET',
  }),

  // 按食材搜索食谱
  searchByIngredients: (ingredients: string[]) => request<any[]>('/app/recipes/by-ingredients', {
    method: 'GET',
    data: { ingredients: ingredients.join(',') },
  }),
};

// ==================== 收藏 API ====================

export const favoriteApi = {
  // 获取收藏列表
  getList: (params?: { page?: number; pageSize?: number }) =>
    request<{ list: any[]; total: number }>('/app/favorites', {
      method: 'GET',
      data: params,
    }),

  // 添加收藏
  add: (recipeId: string) => request<{ favorited: boolean }>('/app/favorites', {
    method: 'POST',
    data: { recipeId },
  }),

  // 取消收藏
  remove: (recipeId: string) => request<{ favorited: boolean }>('/app/favorites/' + recipeId, {
    method: 'DELETE',
  }),

  // 批量检查收藏状态
  checkBatch: (recipeIds: string[]) => request<Record<string, boolean>>('/app/favorites/check', {
    method: 'GET',
    data: { recipeIds: recipeIds.join(',') },
  }),
};

// ==================== 收藏夹 API ====================

export const collectionApi = {
  // 获取收藏夹列表
  getList: () => request<any[]>('/app/collections', {
    method: 'GET',
  }),

  // 创建收藏夹
  create: (name: string, description?: string) => request<any>('/app/collections', {
    method: 'POST',
    data: { name, description },
  }),

  // 获取收藏夹详情
  getDetail: (id: string) => request<any>('/app/collections/' + id, {
    method: 'GET',
  }),

  // 添加到收藏夹
  addRecipe: (collectionId: string, recipeId: string) => request('/app/collections/' + collectionId + '/items', {
    method: 'POST',
    data: { recipeId },
  }),

  // 从收藏夹移除
  removeRecipe: (collectionId: string, recipeId: string) => request('/app/collections/' + collectionId + '/items/' + recipeId, {
    method: 'DELETE',
  }),
};

// ==================== 用户/微信 API ====================

export const userApi = {
  // 微信登录
  login: (code: string) => request<{ token: string; userId: string }>('/wx/login', {
    method: 'POST',
    data: { code },
  }),

  // 绑定手机号
  bindPhone: (phone: string, code?: string) => request('/wx/bind-phone', {
    method: 'POST',
    data: { phone, code },
  }),

  // 获取用户信息
  getUserInfo: () => request<{ nickname: string; avatar: string; phone: string }>('/wx/userinfo', {
    method: 'GET',
  }),

  // 更新用户信息
  updateUserInfo: (data: { nickname?: string; avatar?: string }) => request('/wx/userinfo', {
    method: 'PUT',
    data,
  }),
};

// ==================== 内容 API ====================

export const contentApi = {
  // 获取首页内容
  getHomeContent: () => request<any>('/content/home', {
    method: 'GET',
  }),

  // 获取 Banner 列表
  getBanners: () => request<any[]>('/content/banners', {
    method: 'GET',
  }),
};

// ==================== 反馈 API ====================

export const feedbackApi = {
  // 提交反馈
  submit: (data: {
    type?: string;
    content: string;
    images?: string[];
    contact?: string;
  }) => request('/feedbacks', {
    method: 'POST',
    data,
  }),

  // 获取我的反馈列表
  getMyList: (params?: { page?: number; pageSize?: number }) =>
    request<{ list: any[]; total: number }>('/feedbacks/my', {
      method: 'GET',
      data: params,
    }),
};

// ==================== 文件上传 API ====================

export const uploadApi = {
  // 上传文件（需要后端支持）
  upload: (filePath: string, formData?: Record<string, string>) => {
    return new Promise<RequestResult<{ url: string }>>((resolve) => {
      const token = wx.getStorageSync('token');
      const header: Record<string, string> = {};
      if (token) {
        header['Authorization'] = `Bearer ${token}`;
      }

      wx.uploadFile({
        url: getFullUrl('/upload'),
        filePath,
        name: 'file',
        formData,
        header,
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const data = JSON.parse(res.data);
              if (data.code === 0 || data.code === 200) {
                resolve({ success: true, data: data.data });
              } else {
                resolve({ success: false, error: data.message || '上传失败' });
              }
            } catch {
              resolve({ success: false, error: '解析响应失败' });
            }
          } else {
            resolve({ success: false, error: `上传失败 (${res.statusCode})` });
          }
        },
        fail: (err) => {
          console.error('[Upload] 上传失败:', err);
          resolve({ success: false, error: err.errMsg || '上传失败' });
        },
      });
    });
  },
};

// ==================== 用户数据同步 API ====================

export const syncApi = {
  // 保存用户数据到云端
  saveUserData: (data: {
    nickname?: string;
    avatar?: string;
    favorites?: string[];
    basket?: any;
    fitnessGoal?: any;
    childrenStage?: any;
  }) => request('/user/sync', {
    method: 'POST',
    data,
  }),

  // 获取用户数据
  getUserData: () => request<any>('/user/sync', {
    method: 'GET',
  }),
};

// ==================== 工具函数 ====================

export const apiUtils = {
  // 获取完整 API 地址
  getUrl: getFullUrl,

  // 检查服务是否可用
  checkHealth: async (): Promise<boolean> => {
    try {
      const result = await request<{ status: string }>('/health', {
        timeout: 5000,
      });
      return result.success && result.data && result.data.status === 'ok';
    } catch {
      return false;
    }
  },
};

// 导出配置供外部访问
export const apiConfig = {
  baseUrl: API_BASE_URL,
  prefix: API_PREFIX,
  fullBaseUrl: `${API_BASE_URL}${API_PREFIX}`,
};

// 导出 request 供直接调用
export { request };
