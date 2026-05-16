import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../../../config';

export interface WxAuthPayload {
  id: number;
  openid: string;
  type: string;
}

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      openid?: string;
    }
  }
}

export function wxAuthenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      code: 401,
      message: '请先登录',
      timestamp: Date.now()
    });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, config.jwt.secret) as WxAuthPayload;

    if (payload.type !== 'wx') {
      res.status(401).json({
        code: 401,
        message: '无效的访问令牌',
        timestamp: Date.now()
      });
      return;
    }

    req.userId = payload.id;
    req.openid = payload.openid;
    next();
  } catch (error) {
    res.status(401).json({
      code: 401,
      message: '令牌已过期，请重新登录',
      timestamp: Date.now()
    });
    return;
  }
}
