/**
 * HTTP 请求封装 - 统一处理微信小程序的 API 请求
 * 替换 wx.cloud.callFunction，使用本地后端服务
 */

import { getOpenid, getWxToken } from './authStorage.js';

export interface ApiResult<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  total?: number;
  hasMore?: boolean;
  code?: number;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  header?: Record<string, string>;
  /** API 基础路径，默认从环境配置读取 */
  baseUrl?: string;
  /** 是否携带 openid */
  withOpenid?: boolean;
  /** 是否携带 JWT token */
  withToken?: boolean;
}

const DEFAULT_BASE_URL = (wx as any).__env__?.APP_ENV?.API_BASE_URL || 'https://airecipe.natapp1.cc';

/** 全局错误处理回调 */
type ErrorHandler = (code: number, message: string) => void;
let _globalErrorHandler: ErrorHandler | null = null;

export function setGlobalErrorHandler(handler: ErrorHandler) {
  _globalErrorHandler = handler;
}

function buildUrl(baseUrl: string, endpoint: string, data?: any): string {
  const url = `${baseUrl.replace(/\/$/, '')}${endpoint}`;
  if (!data || typeof data !== 'object') return url;
  const pairs = Object.keys(data)
    .filter((key) => data[key] !== undefined && data[key] !== null && data[key] !== '')
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(String(data[key]))}`);
  return pairs.length ? `${url}?${pairs.join('&')}` : url;
}

/**
 * 发起 API 请求
 */
export function request<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResult<T>> {
  const {
    method = 'GET',
    data,
    header = {},
    baseUrl = DEFAULT_BASE_URL,
    withOpenid = false,
    withToken = false,
  } = options;

  const headers: Record<string, string> = {
    ...header,
  };
  // 仅在有请求体时设置 Content-Type（POST/PUT/DELETE/PATCH）
  if (method !== 'GET' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (withOpenid) {
    const openid = getOpenid();
    if (openid) {
      headers['x-openid'] = openid;
    }
  }

  if (withToken) {
    const token = getWxToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return new Promise((resolve) => {
    const fullUrl = method === 'GET'
      ? buildUrl(baseUrl, endpoint, data)
      : `${baseUrl.replace(/\/$/, '')}${endpoint}`;
    wx.request({
      url: fullUrl,
      method,
      data: method === 'GET' ? undefined : data,
      header: headers,
      timeout: 60000,
      success: (res) => {
        const statusCode = res.statusCode;
        const raw = res.data as any;

        if (statusCode >= 200 && statusCode < 300) {
          // 适配后端 paginated 响应格式: { code, message, data: { list, total, page, pageSize } }
          const rawData = raw?.data;
          let listData: T | null = null;
          if (Array.isArray(rawData)) {
            listData = rawData as unknown as T;
          } else if (rawData && typeof rawData === 'object') {
            listData = (rawData as any).list ?? rawData;
          }
          const ok = raw?.code === 200 || raw?.success === true || raw?.code === undefined;
          resolve({
            success: ok,
            data: listData,
            total: (rawData as any)?.total,
            hasMore: (rawData as any) ? ((rawData as any).page * (rawData as any).pageSize < (rawData as any).total) : false,
            message: raw?.message,
            code: raw?.code,
          });
        } else if (statusCode === 401) {
          // 未登录，清除 token
          if (_globalErrorHandler) {
            _globalErrorHandler(401, '请先登录');
          } else {
            resolve({
              success: false,
              code: 401,
              message: '请先登录',
            });
          }
        } else if (statusCode === 403) {
          if (_globalErrorHandler) {
            _globalErrorHandler(403, '权限不足');
          } else {
            resolve({
              success: false,
              code: 403,
              message: '权限不足',
            });
          }
        } else {
          resolve({
            success: false,
            code: statusCode,
            message: raw?.message || `请求失败 (${statusCode})`,
          });
        }
      },
      fail: (err) => {
        console.error('[API Request] 请求异常:', err);
        resolve({
          success: false,
          code: -1,
          message: '网络异常，请检查网络连接',
        });
      },
    });
  });
}

/** GET 便捷方法 */
export function get<T = any>(endpoint: string, data?: any, options?: Omit<RequestOptions, 'method' | 'data'>): Promise<ApiResult<T>> {
  return request<T>(endpoint, { ...options, method: 'GET', data });
}

/** POST 便捷方法 */
export function post<T = any>(endpoint: string, data?: any, options?: Omit<RequestOptions, 'method' | 'data'>): Promise<ApiResult<T>> {
  return request<T>(endpoint, { ...options, method: 'POST', data });
}

/** PUT 便捷方法 */
export function put<T = any>(endpoint: string, data?: any, options?: Omit<RequestOptions, 'method' | 'data'>): Promise<ApiResult<T>> {
  return request<T>(endpoint, { ...options, method: 'PUT', data });
}

/** DELETE 便捷方法 */
export function del<T = any>(endpoint: string, data?: any, options?: Omit<RequestOptions, 'method' | 'data'>): Promise<ApiResult<T>> {
  return request<T>(endpoint, { ...options, method: 'DELETE', data });
}

// ============ 文件上传（需单独实现 wx.uploadFile）============

const UPLOAD_BASE_URL = (wx as any).__env__?.APP_ENV?.API_BASE_URL || 'https://airecipe.natapp1.cc';

export interface UploadResult {
  success: boolean;
  data?: { url: string };
  message?: string;
}

/**
 * 上传文件到后端 COS
 * @param endpoint 完整路径（不含 baseUrl）
 * @param filePath 微信临时文件路径
 * @param name formData 的 file 字段名
 * @param formData 附加表单数据
 */
export function upload(
  endpoint: string,
  filePath: string,
  name: string = 'file',
  formData?: Record<string, string>
): Promise<UploadResult> {
  return new Promise((resolve) => {
    const token = getWxToken();
    const headers: Record<string, string> = {
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    wx.uploadFile({
      url: `${UPLOAD_BASE_URL}${endpoint}`,
      filePath,
      name,
      formData,
      header: headers,
      timeout: 60000,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const raw = JSON.parse(res.data);
            resolve({
              success: raw?.code === 200,
              data: raw?.data,
              message: raw?.message,
            });
          } catch {
            resolve({ success: false, message: '解析响应失败' });
          }
        } else {
          resolve({ success: false, message: `上传失败 (${res.statusCode})` });
        }
      },
      fail: (err) => {
        console.error('[Upload] 上传失败:', err);
        resolve({ success: false, message: err.errMsg || '上传失败' });
      },
    });
  });
}
