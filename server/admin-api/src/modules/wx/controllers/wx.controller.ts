import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
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
    throw new Error('微信小程序配置未完成，请设置 WECHAT_APPID 和 WECHAT_SECRET');
  }

  const url = `${WECHAT_API_URL}?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;

  try {
    const response = await fetch(url);
    const data = await response.json() as WxSessionResult;

    if (data.errcode) {
      throw new Error(data.errmsg || '微信登录失败');
    }

    return data;
  } catch (error) {
    console.error('[WxService] 微信登录失败:', error);
    throw error;
  }
}

function generateToken(user: { id: number; openid: string }) {
  return jwt.sign(
    { id: user.id, openid: user.openid, type: 'wx' },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'] }
  );
}

export async function wxLogin(req: Request, res: Response) {
  const { code, userInfo } = req.body;

  if (!code) {
    res.status(400).json(badRequest('缺少 code 参数'));
    return;
  }

  try {
    const session = await getWxSession(code);

    if (!session.openid) {
      res.status(401).json(unauthorized('微信登录失败'));
      return;
    }

    let user = await prisma.user.findUnique({
      where: { openid: session.openid }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          openid: session.openid,
          unionid: session.unionid || null,
          nickname: userInfo?.nickName || null,
          avatar: userInfo?.avatarUrl || null,
          gender: userInfo?.gender !== undefined
            ? (userInfo.gender === 1 ? 'MALE' : userInfo.gender === 2 ? 'FEMALE' : 'UNKNOWN')
            : 'UNKNOWN',
          lastLoginAt: new Date(),
        }
      });

      // 为新用户自动创建默认收藏夹
      await prisma.collection.create({
        data: {
          userId: user.id,
          name: '我的收藏',
          description: '默认收藏夹',
          isPublic: false,
          itemCount: 0,
        },
      });
    } else {
      const updateData: any = {
        lastLoginAt: new Date(),
      };
      if (userInfo) {
        if (userInfo.nickName) updateData.nickname = userInfo.nickName;
        if (userInfo.avatarUrl) updateData.avatar = userInfo.avatarUrl;
      }
      user = await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      // 为老用户补建默认收藏夹（如果还没有的话）
      const existingDefault = await prisma.collection.findFirst({
        where: { userId: user.id, name: '我的收藏' },
      });
      if (!existingDefault) {
        await prisma.collection.create({
          data: {
            userId: user.id,
            name: '我的收藏',
            description: '默认收藏夹',
            isPublic: false,
            itemCount: 0,
          },
        });
      }
    }

    const token = generateToken(user);

    res.json(success({
      token,
      openid: user.openid,
      userId: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      hasPhone: !!user.phone,
    }, '登录成功'));
  } catch (error: any) {
    console.error('[WxService] 登录异常:', error);
    res.status(500).json(badRequest(error.message || '登录失败'));
  }
}

export async function bindPhone(req: Request, res: Response) {
  const { phone, code } = req.body;
  const userId = (req as any).userId;

  if (!phone) {
    res.status(400).json(badRequest('请提供手机号'));
    return;
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { phone }
    });

    res.json(success({
      userId: user.id,
      phone: user.phone,
    }, '绑定成功'));
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json(badRequest('该手机号已被绑定'));
      return;
    }
    throw error;
  }
}

export async function getWxUserInfo(req: Request, res: Response) {
  const userId = (req as any).userId;

  try {
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
      }
    });

    if (!user) {
      res.status(404).json(badRequest('用户不存在'));
      return;
    }

    res.json(success({
      ...user,
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
      createdAt: user.createdAt.toISOString(),
    }));
  } catch (error) {
    throw error;
  }
}

export async function updateWxUserInfo(req: Request, res: Response) {
  const userId = (req as any).userId;
  const { nickname, avatar, gender, bio, phone } = req.body;

  try {
    const data: any = {};
    if (nickname !== undefined) data.nickname = nickname;
    if (avatar !== undefined) data.avatar = avatar;
    if (gender !== undefined) {
      const validGenders = ['MALE', 'FEMALE', 'UNKNOWN'];
      data.gender = validGenders.includes(gender) ? gender : 'UNKNOWN';
    }
    if (bio !== undefined) data.bio = bio;
    if (phone !== undefined) data.phone = phone;

    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });

    res.json(success({
      nickname: user.nickname,
      avatar: user.avatar,
      gender: user.gender,
      bio: user.bio,
      phone: user.phone,
    }, '更新成功'));
  } catch (error) {
    throw error;
  }
}

export async function changePassword(req: Request, res: Response) {
  const userId = (req as any).userId;
  const { oldPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    res.status(400).json(badRequest('新密码不能少于6位'));
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) {
      res.status(404).json(badRequest('用户不存在'));
      return;
    }

    if (user.password) {
      if (!oldPassword) {
        res.status(400).json(badRequest('请输入原密码'));
        return;
      }
      const bcrypt = await import('bcryptjs');
      const isMatch = bcrypt.compareSync(oldPassword, user.password);
      if (!isMatch) {
        res.status(400).json(badRequest('原密码错误'));
        return;
      }
    }

    const hashed = await (await import('bcryptjs')).default.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    res.json(success(null, '密码修改成功'));
  } catch (error) {
    throw error;
  }
}
