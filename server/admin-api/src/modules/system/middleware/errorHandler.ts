import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../../types/response';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

export class HttpException extends Error implements AppError {
  statusCode: number;
  code?: string;
  isOperational: boolean;

  constructor(message: string, statusCode = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestException extends HttpException {
  constructor(message = '请求参数错误') {
    super(message, 400, 'BAD_REQUEST');
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message = '未授权，请登录') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenException extends HttpException {
  constructor(message = '无权限访问') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundException extends HttpException {
  constructor(message = '资源不存在') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictException extends HttpException {
  constructor(message = '资源冲突') {
    super(message, 409, 'CONFLICT');
  }
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : '服务器内部错误';

  console.error(`[Error] ${req.method} ${req.path}:`, err);

  const response: ApiResponse = {
    code: statusCode,
    message,
    timestamp: Date.now(),
  };

  if (process.env.NODE_ENV === 'development') {
    (response as any).stack = err.stack;
  }

  res.status(statusCode).json(response);
}
