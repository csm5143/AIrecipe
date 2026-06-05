import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import config from '../../../config';
import { prisma } from '../../../lib/prisma';
import { success, badRequest, unauthorized } from '../../../types/response';

const WECHAT_API_URL = 'https://api.weixin.qq.com/sns/jscode2session';

interface WxSessionResult {
  openid?: string;
  session_key?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

async function getWxSession(code: string): Promise<WxSessionResult> {
  const appid = process.env.WECHAT_APPID;
  const secret = process.env.WECHAT_SECRET;

  if (!appid || !secret) {
    throw new Error('WECHAT_APPID and WECHAT_SECRET are required');
  }

  const url = `${WECHAT_API_URL}?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;
  const response = await fetch(url);
  const data = (await response.json()) as WxSessionResult;

  if (data.errcode) {
    throw new Error(data.errmsg || 'WeChat login failed');
  }

  return data;
}

function generateToken(user: { id: number; openid?: string | null }) {
  return jwt.sign(
    { id: user.id, openid: user.openid || '', type: 'wx' },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'] }
  );
}

async function ensureDefaultCollection(userId: number) {
  const existingDefault = await prisma.collection.findFirst({
    where: { userId, name: 'My Favorites' },
  });

  if (!existingDefault) {
    await prisma.collection.create({
      data: {
        userId,
        name: 'My Favorites',
        description: 'Default collection',
        isPublic: false,
        itemCount: 0,
      },
    });
  }
}

function mapAuthUser(user: {
  id: number;
  openid: string | null;
  phone: string | null;
  nickname: string | null;
  avatar: string | null;
  bio?: string | null;
}) {
  return {
    id: user.id,
    userId: user.id,
    openid: user.openid || '',
    phone: user.phone,
    nickname: user.nickname,
    avatar: user.avatar,
    bio: user.bio || '',
    hasPhone: !!user.phone,
  };
}

export async function phoneRegister(req: Request, res: Response) {
  const { phone, password, nickname } = req.body;

  if (!phone || !password) {
    res.status(400).json(badRequest('Phone and password are required'));
    return;
  }

  if (String(password).length < 6) {
    res.status(400).json(badRequest('Password must be at least 6 characters'));
    return;
  }

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    res.status(400).json(badRequest('Phone number is already registered'));
    return;
  }

  const user = await prisma.user.create({
    data: {
      phone,
      password: bcrypt.hashSync(password, 10),
      nickname: nickname || `User${String(phone).slice(-4)}`,
      lastLoginAt: new Date(),
      lastLoginIp: req.ip,
      lastLoginPlatform: 'APP',
    },
  });

  await ensureDefaultCollection(user.id);

  const token = generateToken(user);
  res.json(success({ token, ...mapAuthUser(user) }, 'Registered'));
}

export async function phoneLogin(req: Request, res: Response) {
  const { phone, password } = req.body;

  if (!phone || !password) {
    res.status(400).json(badRequest('Phone and password are required'));
    return;
  }

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user || !user.password || !bcrypt.compareSync(password, user.password)) {
    res.status(401).json(unauthorized('Invalid phone or password'));
    return;
  }

  if (user.status !== 'ACTIVE') {
    res.status(403).json(badRequest('Account is not active'));
    return;
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLoginAt: new Date(),
      lastLoginIp: req.ip,
      lastLoginPlatform: 'APP',
    },
  });

  await ensureDefaultCollection(updated.id);

  const token = generateToken(updated);
  res.json(success({ token, ...mapAuthUser(updated) }, 'Logged in'));
}

export async function wxLogin(req: Request, res: Response) {
  const { code, userInfo } = req.body;

  if (!code) {
    res.status(400).json(badRequest('Missing code'));
    return;
  }

  try {
    const session = await getWxSession(code);

    if (!session.openid) {
      res.status(401).json(unauthorized('WeChat login failed'));
      return;
    }

    let user = await prisma.user.findUnique({
      where: { openid: session.openid },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          openid: session.openid,
          unionid: session.unionid || null,
          nickname: userInfo?.nickName || null,
          avatar: userInfo?.avatarUrl || null,
          gender:
            userInfo?.gender === 1
              ? 'MALE'
              : userInfo?.gender === 2
                ? 'FEMALE'
                : 'UNKNOWN',
          lastLoginAt: new Date(),
          lastLoginPlatform: 'MINIPROGRAM',
        },
      });
    } else {
      const updateData: any = {
        lastLoginAt: new Date(),
        lastLoginPlatform: 'MINIPROGRAM',
      };
      if (userInfo?.nickName) updateData.nickname = userInfo.nickName;
      if (userInfo?.avatarUrl) updateData.avatar = userInfo.avatarUrl;

      user = await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });
    }

    await ensureDefaultCollection(user.id);

    const token = generateToken(user);
    res.json(success({ token, ...mapAuthUser(user) }, 'Logged in'));
  } catch (error: any) {
    console.error('[WxService] login error:', error);
    res.status(500).json(badRequest(error.message || 'Login failed'));
  }
}

export async function bindPhone(req: Request, res: Response) {
  const { phone } = req.body;
  const userId = (req as any).userId;

  if (!phone) {
    res.status(400).json(badRequest('Phone is required'));
    return;
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { phone },
    });

    res.json(success({ userId: user.id, phone: user.phone }, 'Bound'));
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json(badRequest('Phone number is already bound'));
      return;
    }
    throw error;
  }
}

export async function getWxUserInfo(req: Request, res: Response) {
  const userId = (req as any).userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      openid: true,
      nickname: true,
      avatar: true,
      phone: true,
      gender: true,
      bio: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  if (!user) {
    res.status(404).json(badRequest('User not found'));
    return;
  }

  res.json(
    success({
      ...user,
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
      createdAt: user.createdAt.toISOString(),
    })
  );
}

export async function updateWxUserInfo(req: Request, res: Response) {
  const userId = (req as any).userId;
  const { nickname, avatar, gender, bio, phone } = req.body;

  const data: any = {};
  if (nickname !== undefined) data.nickname = nickname;
  if (avatar !== undefined) data.avatar = avatar;
  if (gender !== undefined) {
    data.gender = ['MALE', 'FEMALE', 'UNKNOWN'].includes(gender)
      ? gender
      : 'UNKNOWN';
  }
  if (bio !== undefined) data.bio = bio;
  if (phone !== undefined) data.phone = phone;

  const user = await prisma.user.update({
    where: { id: userId },
    data,
  });

  res.json(
    success(
      {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        gender: user.gender,
        bio: user.bio,
        phone: user.phone,
      },
      'Updated'
    )
  );
}

export async function changePassword(req: Request, res: Response) {
  const userId = (req as any).userId;
  const { oldPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    res.status(400).json(badRequest('New password must be at least 6 characters'));
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });

  if (!user) {
    res.status(404).json(badRequest('User not found'));
    return;
  }

  if (user.password) {
    if (!oldPassword) {
      res.status(400).json(badRequest('Old password is required'));
      return;
    }
    if (!bcrypt.compareSync(oldPassword, user.password)) {
      res.status(400).json(badRequest('Old password is incorrect'));
      return;
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { password: bcrypt.hashSync(newPassword, 10) },
  });

  res.json(success(null, 'Password updated'));
}
