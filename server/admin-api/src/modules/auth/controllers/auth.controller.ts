import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../../../config';
import { UnauthorizedException, BadRequestException } from '../../system/middleware/errorHandler';

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

interface UpdateProfileDto {
  nickname?: string;
  phone?: string;
}

export async function updateProfile(req: Request, res: Response) {
  const { nickname, phone } = req.body as UpdateProfileDto;

  if (!nickname && !phone) {
    throw new BadRequestException('至少需要提供昵称或手机号其中一项');
  }

  // TODO: 真实场景下从数据库更新
  res.json({
    code: 200,
    message: '个人信息更新成功',
    data: {
      id: 1,
      username: 'admin',
      nickname: nickname || '管理员',
      phone: phone || '',
      role: 'ADMIN',
      avatar: null,
    },
    timestamp: Date.now(),
  });
}

interface ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
}

export async function changePassword(req: Request, res: Response) {
  const { oldPassword, newPassword } = req.body as ChangePasswordDto;

  if (!oldPassword || !newPassword) {
    throw new BadRequestException('请填写完整信息');
  }

  if (newPassword.length < 6) {
    throw new BadRequestException('新密码长度不能少于 6 位');
  }

  if (oldPassword === newPassword) {
    throw new BadRequestException('新密码不能与当前密码相同');
  }

  // TODO: 真实场景下验证旧密码并更新
  res.json({
    code: 200,
    message: '密码修改成功',
    timestamp: Date.now(),
  });
}

interface UpdateAvatarDto {
  avatar: string;
}

export async function updateAvatar(req: Request, res: Response) {
  const { avatar } = req.body as UpdateAvatarDto;

  if (!avatar) {
    throw new BadRequestException('请上传头像');
  }

  res.json({
    code: 200,
    message: '头像更新成功',
    data: { avatar },
    timestamp: Date.now(),
  });
}
