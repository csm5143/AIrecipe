/**
 * API 请求封装
 * 基于 uni.request 封装，统一处理请求拦截、响应拦截、错误处理
 */

import { getToken, clearToken } from '@/utils/auth';
import { showToast } from '@/utils/toast';

interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  params?: Record<string, any>;
  header?: Record<string, string>;
  loading?: boolean;
  loadingText?: string;
  timeout?: number;
}

interface RequestConfig {
  baseURL: string;
  timeout: number;
}

const config: RequestConfig = {
  // 开发环境使用本地后端，生产环境替换为实际 API 地址
  baseURL: process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000/api/v1'
    : 'https://your-api-domain.com/api/v1',
  timeout: 15000,
};

// 显示加载中
let loadingCount = 0;
let loadingTimer: ReturnType<typeof setTimeout> | null = null;

const showLoading = (text = '加载中...') => {
  loadingCount++;
  if (loadingCount === 1) {
    loadingTimer = setTimeout(() => {
      uni.showLoading({ title: text, mask: true });
    }, 300);
  }
};

const hideLoading = () => {
  loadingCount--;
  if (loadingCount <= 0) {
    loadingCount = 0;
    if (loadingTimer) {
      clearTimeout(loadingTimer);
      loadingTimer = null;
    }
    uni.hideLoading();
  }
};

/**
 * 核心请求方法
 */
export function request<T = any>(options: RequestOptions): Promise<T> {
  const {
    url,
    method = 'GET',
    data,
    params,
    header = {},
    loading = true,
    loadingText,
    timeout = config.timeout,
  } = options;

  // 拼接完整 URL
  const fullUrl = params
    ? `${config.baseURL}${url}?${new URLSearchParams(params).toString()}`
    : `${config.baseURL}${url}`;

  // 添加 Token
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...header,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 显示加载
  if (loading) {
    showLoading(loadingText);
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url: fullUrl,
      method,
      data,
      header: headers,
      timeout,
      success: (res) => {
        if (loading) hideLoading();
        handleResponse<T>(res, resolve, reject);
      },
      fail: (err) => {
        if (loading) hideLoading();
        handleError(err, reject);
      },
    });
  });
}

/**
 * 处理响应数据
 */
function handleResponse<T>(
  res: UniApp.RequestSuccessCallbackResult,
  resolve: (value: T) => void,
  reject: (reason?: any) => void
) {
  const { statusCode, data } = res;

  if (statusCode >= 200 && statusCode < 300) {
    // 业务错误处理
    if (data && typeof data === 'object' && 'code' in data) {
      const response = data as { code: number; message: string };

      if (response.code === 200 || response.code === 0) {
        resolve(data as T);
      } else if (response.code === 401) {
        // Token 过期，跳转登录
        handleUnauthorized();
        reject(new Error(response.message || '登录已过期'));
      } else if (response.code === 403) {
        showToast('暂无权限');
        reject(new Error(response.message || '暂无权限'));
      } else if (response.code === 404) {
        showToast('资源不存在');
        reject(new Error(response.message || '资源不存在'));
      } else if (response.code === 500) {
        showToast('服务器错误');
        reject(new Error(response.message || '服务器错误'));
      } else {
        showToast(response.message || '请求失败');
        reject(new Error(response.message || '请求失败'));
      }
    } else {
      resolve(data as T);
    }
  } else if (statusCode === 401) {
    handleUnauthorized();
    reject(new Error('登录已过期'));
  } else if (statusCode === 403) {
    showToast('暂无权限');
    reject(new Error('暂无权限'));
  } else if (statusCode === 404) {
    showToast('资源不存在');
    reject(new Error('资源不存在'));
  } else if (statusCode >= 500) {
    showToast('服务器错误，请稍后重试');
    reject(new Error('服务器错误'));
  } else {
    showToast(`请求失败 (${statusCode})`);
    reject(new Error(`请求失败 (${statusCode})`));
  }
}

/**
 * 处理请求错误
 */
function handleError(err: UniApp.RequestFailCallbackResult, reject: (reason?: any) => void) {
  const { errMsg } = err;

  if (errMsg.includes('timeout')) {
    showToast('请求超时，请检查网络');
    reject(new Error('请求超时'));
  } else if (errMsg.includes('abort')) {
    reject(new Error('请求取消'));
  } else if (errMsg.includes('network')) {
    showToast('网络错误，请检查网络连接');
    reject(new Error('网络错误'));
  } else {
    showToast('请求失败');
    reject(new Error(errMsg));
  }
}

/**
 * 处理未授权
 */
function handleUnauthorized() {
  clearToken();
  showToast('登录已过期，请重新登录');

  // 延迟跳转，避免 Toast 被覆盖
  setTimeout(() => {
    uni.navigateTo({
      url: '/pages/login/index',
    });
  }, 1500);
}

// ==================== 快捷请求方法 ====================

export const get = <T = any>(url: string, options?: Partial<RequestOptions>) =>
  request<T>({ url, method: 'GET', ...options });

export const post = <T = any>(url: string, options?: Partial<RequestOptions>) =>
  request<T>({ url, method: 'POST', ...options });

export const put = <T = any>(url: string, options?: Partial<RequestOptions>) =>
  request<T>({ url, method: 'PUT', ...options });

export const del = <T = any>(url: string, options?: Partial<RequestOptions>) =>
  request<T>({ url, method: 'DELETE', ...options });

export const patch = <T = any>(url: string, options?: Partial<RequestOptions>) =>
  request<T>({ url, method: 'PATCH', ...options });

// ==================== 文件上传 ====================

export interface UploadOptions {
  filePath: string;
  name?: string;
  formData?: Record<string, any>;
  loading?: boolean;
}

export function uploadFile<T = any>(url: string, options: UploadOptions): Promise<T> {
  const { filePath, name = 'file', formData = {}, loading = true } = options;

  if (loading) {
    showLoading('上传中...');
  }

  const token = getToken();
  const header: Record<string, string> = {};
  if (token) {
    header['Authorization'] = `Bearer ${token}`;
  }

  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${config.baseURL}${url}`,
      filePath,
      name,
      formData,
      header,
      success: (res) => {
        if (loading) hideLoading();

        if (res.statusCode >= 200 && res.statusCode < 300) {
          const data = JSON.parse(res.data);
          if (data.code === 200) {
            resolve(data as T);
          } else {
            showToast(data.message || '上传失败');
            reject(new Error(data.message));
          }
        } else {
          showToast('上传失败');
          reject(new Error('上传失败'));
        }
      },
      fail: (err) => {
        if (loading) hideLoading();
        showToast('上传失败');
        reject(err);
      },
    });
  });
}

// ==================== 导出配置 ====================

export { config as apiConfig };
