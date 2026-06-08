import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../../../config';
import { prisma } from '../../../lib/prisma';

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
      userStatus?: string;
    }
  }
}

export async function wxAuthenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ code: 401, message: '请先登录', timestamp: Date.now() });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, config.jwt.secret) as WxAuthPayload;

    if (payload.type !== 'wx') {
      res.status(401).json({ code: 401, message: '无效的访问令牌', timestamp: Date.now() });
      return;
    }

    // 检查账号是否已被软删或冻结
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, status: true, deletedAt: true },
    });

    if (!user) {
      res.status(401).json({ code: 401, message: '账号不存在', timestamp: Date.now() });
      return;
    }

    if (user.deletedAt) {
      res.status(401).json({ code: 401, message: '账号已注销', timestamp: Date.now() });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({ code: 403, message: '账号已被冻结，请联系客服', timestamp: Date.now() });
      return;
    }

    req.userId = user.id;
    req.openid = payload.openid;
    next();
  } catch (error) {
    res.status(401).json({ code: 401, message: '令牌已过期，请重新登录', timestamp: Date.now() });
  }
}
