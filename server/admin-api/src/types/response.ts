import { Request, Response, NextFunction } from 'express';

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
  timestamp: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export function success<T>(data?: T, message = '操作成功'): ApiResponse<T> {
  return {
    code: 200,
    message,
    data,
    timestamp: Date.now(),
  };
}

export function paginated<T>(
  data: T[],
  pagination: { page: number; pageSize: number; total: number },
  message = '查询成功'
): PaginatedResponse<T> {
  return {
    code: 200,
    message,
    data,
    pagination: {
      ...pagination,
      totalPages: Math.ceil(pagination.total / pagination.pageSize),
    },
    timestamp: Date.now(),
  };
}

export function error(message = '操作失败', code = 500): ApiResponse {
  return {
    code,
    message,
    timestamp: Date.now(),
  };
}

export function notFound(message = '资源不存在'): ApiResponse {
  return {
    code: 404,
    message,
    timestamp: Date.now(),
  };
}

export function unauthorized(message = '未授权'): ApiResponse {
  return {
    code: 401,
    message,
    timestamp: Date.now(),
  };
}

export function forbidden(message = '无权限'): ApiResponse {
  return {
    code: 403,
    message,
    timestamp: Date.now(),
  };
}

export function badRequest(message = '请求参数错误'): ApiResponse {
  return {
    code: 400,
    message,
    timestamp: Date.now(),
  };
}

export function sendResponse(res: Response, data: ApiResponse, statusCode = 200) {
  res.status(statusCode).json(data);
}

export type RequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<void> | void;

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface SearchQuery extends PaginationQuery {
  keyword?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}
