import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../../../config';
import { prisma } from '../../../lib/prisma';
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

  const admin = await prisma.admin.findUnique({ where: { username, isDeleted: false } });
  if (!admin || !bcrypt.compareSync(password, admin.password)) {
    throw new UnauthorizedException('用户名或密码错误');
  }

  const token = jwt.sign(
    { id: admin.id, username: admin.username, role: admin.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'] }
  );

  const refreshToken = jwt.sign(
    { id: admin.id, type: 'refresh' },
    config.jwt.secret,
    { expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'] }
  );

  const { password: _, ...safeAdmin } = admin;

  res.json({
    code: 200,
    message: '登录成功',
    data: {
      token,
      refreshToken,
      expiresIn: config.jwt.expiresIn,
      admin: safeAdmin,
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
  const adminId = (req as any).admin?.id;
  if (!adminId) {
    throw new UnauthorizedException('未登录');
  }

  const admin = await prisma.admin.findUnique({ where: { id: adminId, isDeleted: false } });
  if (!admin) {
    throw new UnauthorizedException('管理员不存在');
  }

  const { password: _, ...safeAdmin } = admin;
  res.json({
    code: 200,
    message: 'success',
    data: safeAdmin,
    timestamp: Date.now(),
  });
}

export async function refreshToken(req: Request, res: Response) {
  const { refreshToken: token } = req.body;
  if (!token) {
    throw new UnauthorizedException('刷新令牌不能为空');
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret) as { id: number; type: string };
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('无效的刷新令牌');
    }

    const admin = await prisma.admin.findUnique({ where: { id: payload.id } });
    if (!admin) {
      throw new UnauthorizedException('管理员不存在');
    }

    const newToken = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'] }
    );

    res.json({
      code: 200,
      message: '令牌刷新成功',
      data: { token: newToken, expiresIn: config.jwt.expiresIn },
      timestamp: Date.now(),
    });
  } catch {
    throw new UnauthorizedException('刷新令牌无效或已过期');
  }
}

interface UpdateProfileDto {
  nickname?: string;
  phone?: string;
}

export async function updateProfile(req: Request, res: Response) {
  const adminId = (req as any).admin?.id;
  if (!adminId) {
    throw new UnauthorizedException('未登录');
  }

  const { nickname, phone } = req.body as UpdateProfileDto;
  if (!nickname && !phone) {
    throw new BadRequestException('至少需要提供昵称或手机号其中一项');
  }

  const updated = await prisma.admin.update({
    where: { id: adminId },
    data: {
      ...(nickname !== undefined && { nickname }),
      ...(phone !== undefined && { phone }),
    },
  });

  const { password: _, ...safeAdmin } = updated;

  res.json({
    code: 200,
    message: '个人信息更新成功',
    data: safeAdmin,
    timestamp: Date.now(),
  });
}

interface ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
}

export async function changePassword(req: Request, res: Response) {
  const adminId = (req as any).admin?.id;
  if (!adminId) {
    throw new UnauthorizedException('未登录');
  }

  const { oldPassword, newPassword } = req.body as ChangePasswordDto;

  if (!oldPassword || !newPassword) {
    throw new BadRequestException('请填写完整信息');
  }

  if (newPassword.length < 6) {
    throw new BadRequestException('新密码长度不能少于 6 位');
  }

  const admin = await prisma.admin.findUnique({ where: { id: adminId, isDeleted: false } });
  if (!admin) {
    throw new UnauthorizedException('管理员不存在');
  }

  if (!bcrypt.compareSync(oldPassword, admin.password)) {
    throw new UnauthorizedException('当前密码错误');
  }

  if (oldPassword === newPassword) {
    throw new BadRequestException('新密码不能与当前密码相同');
  }

  const passwordHash = bcrypt.hashSync(newPassword, 10);
  await prisma.admin.update({
    where: { id: adminId },
    data: { password: passwordHash },
  });

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
  const adminId = (req as any).admin?.id;
  if (!adminId) {
    throw new UnauthorizedException('未登录');
  }

  const { avatar } = req.body as UpdateAvatarDto;

  if (!avatar) {
    throw new BadRequestException('请上传头像');
  }

  const updated = await prisma.admin.update({
    where: { id: adminId },
    data: { avatar },
  });

  res.json({
    code: 200,
    message: '头像更新成功',
    data: { avatar: updated.avatar },
    timestamp: Date.now(),
  });
}
