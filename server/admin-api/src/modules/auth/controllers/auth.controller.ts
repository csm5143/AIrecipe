import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../../../config';
import { UnauthorizedException } from '../../system/middleware/errorHandler';

interface LoginDto {
  username: string;
  password: string;
}

export async function login(req: Request, res: Response) {
  const { username, password } = req.body as LoginDto;

  if (!username || !password) {
    throw new UnauthorizedException('用户名和密码不能为空');
  }

  // TODO: 查询管理员账号
  // const admin = await prisma.admin.findUnique({ where: { username } });
  // if (!admin || !await bcrypt.compare(password, admin.password)) {
  //   throw new UnauthorizedException('用户名或密码错误');
  // }

  const token = jwt.sign(
    { id: 1, username, role: 'ADMIN' },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  const refreshToken = jwt.sign(
    { id: 1, type: 'refresh' },
    config.jwt.secret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );

  res.json({
    code: 200,
    message: '登录成功',
    data: {
      token,
      refreshToken,
      expiresIn: config.jwt.expiresIn,
      admin: {
        id: 1,
        username,
        nickname: username,
        role: 'ADMIN',
      },
    },
    timestamp: Date.now(),
  });
}

export async function logout(req: Request, res: Response) {
  res.json({
    code: 200,
    message: '退出成功',
    timestamp: Date.now(),
  });
}

export async function getProfile(req: Request, res: Response) {
  res.json({
    code: 200,
    message: 'success',
    data: {
      id: 1,
      username: 'admin',
      nickname: '管理员',
      role: 'ADMIN',
      avatar: null,
    },
    timestamp: Date.now(),
  });
}

export async function refreshToken(req: Request, res: Response) {
  const { refreshToken: token } = req.body;
  if (!token) {
    throw new UnauthorizedException('刷新令牌不能为空');
  }

  // TODO: 验证刷新令牌并生成新令牌
  const newToken = jwt.sign(
    { id: 1, username: 'admin', role: 'ADMIN' },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  res.json({
    code: 200,
    message: '令牌刷新成功',
    data: { token: newToken, expiresIn: config.jwt.expiresIn },
    timestamp: Date.now(),
  });
}
