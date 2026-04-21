import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../../../config';
import { UnauthorizedException, ForbiddenException } from '../../system/middleware/errorHandler';

export interface JwtPayload {
  id: number;
  username: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      admin?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedException('未提供认证令牌');
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.admin = payload;
    next();
  } catch {
    throw new UnauthorizedException('令牌无效或已过期');
  }
}

export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) {
      throw new UnauthorizedException('未登录');
    }

    if (roles.length > 0 && !roles.includes(req.admin.role)) {
      throw new ForbiddenException('权限不足');
    }

    next();
  };
}
