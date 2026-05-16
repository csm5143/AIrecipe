/**
 * HTTP 请求封装 - 统一处理微信小程序的 API 请求
 * 替换 wx.cloud.callFunction，使用本地后端服务
 */

import { getOpenid, getWxToken } from './authStorage';

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

const DEFAULT_BASE_URL = 'http://localhost:3000';

/** 全局错误处理回调 */
type ErrorHandler = (code: number, message: string) => void;
let _globalErrorHandler: ErrorHandler | null = null;

export function setGlobalErrorHandler(handler: ErrorHandler) {
  _globalErrorHandler = handler;
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
    'Content-Type': 'application/json',
    ...header,
  };

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
    wx.request({
      url: `${baseUrl}${endpoint}`,
      method,
      data,
      header: headers,
      timeout: 30000,
      success: (res) => {
        const statusCode = res.statusCode;

        if (statusCode >= 200 && statusCode < 300) {
          resolve(res.data as ApiResult<T>);
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
          const body = res.data as ApiResult<T>;
          resolve({
            success: false,
            code: statusCode,
            message: body?.message || `请求失败 (${statusCode})`,
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
