import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import config from '../../../config';
import { prisma } from '../../../lib/prisma';
import { logUserActivity } from '../../../services/activityLog.service';
import { sendBindEmailCode, sendRegisterCode, sendResetPasswordCode } from '../../../services/email.service';
import { sendSms } from '../../../services/sms.service';
import { createVerificationCode, normalizeVerificationType, verifyCode } from '../../../services/verification.service';
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

function normalizeEmail(email?: string) {
  return email ? String(email).trim().toLowerCase() : undefined;
}

function normalizePhone(phone?: string) {
  return phone ? String(phone).trim() : undefined;
}

function resolveAccount(body: any) {
  const email = normalizeEmail(body.email);
  const phone = normalizePhone(body.phone);
  return { email, phone };
}

function mapAuthUser(user: {
  id: number;
  openid: string | null;
  phone: string | null;
  email?: string | null;
  nickname: string | null;
  avatar: string | null;
  bio?: string | null;
}) {
  return {
    id: user.id,
    userId: user.id,
    openid: user.openid || '',
    phone: user.phone,
    email: user.email || '',
    nickname: user.nickname,
    avatar: user.avatar,
    bio: user.bio || '',
    hasPhone: !!user.phone,
    hasEmail: !!user.email,
  };
}

// 验证码发送限流：每 IP 每分钟最多 3 次
const codeRateMap = new Map<string, number[]>();
const CODE_RATE_LIMIT = 3;
const CODE_RATE_WINDOW_MS = 60_000;

function checkSendCodeRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = codeRateMap.get(ip) || [];
  const recent = timestamps.filter(t => now - t < CODE_RATE_WINDOW_MS);
  if (recent.length >= CODE_RATE_LIMIT) {
    codeRateMap.set(ip, recent); // 保留窗口内记录
    return false;
  }
  recent.push(now);
  codeRateMap.set(ip, recent);
  return true;
}

// 定期清理过期记录（每 5 分钟）
setInterval(() => {
  const cutoff = Date.now() - CODE_RATE_WINDOW_MS;
  for (const [ip, timestamps] of codeRateMap) {
    const fresh = timestamps.filter(t => t > cutoff);
    if (fresh.length === 0) codeRateMap.delete(ip);
    else codeRateMap.set(ip, fresh);
  }
}, 300_000);

export async function sendCode(req: Request, res: Response) {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

  if (!checkSendCodeRateLimit(clientIp)) {
    res.status(429).json(badRequest('验证码发送过于频繁，请 1 分钟后再试'));
    return;
  }

  const { email, phone } = resolveAccount(req.body);
  const type = normalizeVerificationType(req.body.type);

  if (!email && !phone) {
    res.status(400).json(badRequest('请填写手机号或邮箱'));
    return;
  }

  const typeLabel =
    type === 'REGISTER' ? '注册'
    : type === 'RESETPASSWORD' ? '重置密码'
    : type === 'BIND' ? '邮箱绑定'
    : '管理员重置';

  // 尝试找已有用户（重置密码/绑定场景），用于活动日志
  let existingUserId: number | undefined;
  if (type !== 'REGISTER') {
    const existing = email
      ? await prisma.user.findUnique({ where: { email }, select: { id: true } })
      : phone
        ? await prisma.user.findUnique({ where: { phone }, select: { id: true } })
        : null;
    existingUserId = existing?.id;
  }

  const target = email || phone || '';

  try {
    const code = await createVerificationCode({ userId: existingUserId, email, phone, type });
    if (email) {
      if (type === 'REGISTER') sendRegisterCode(email, code);
      else if (type === 'BIND') sendBindEmailCode(email, code);
      else sendResetPasswordCode(email, code);
    } else if (phone) {
      await sendSms(phone, code, type);
    }

    if (existingUserId) {
      logUserActivity({
        userId: existingUserId,
        action: 'sendVerifyCode',
        targetId: target,
        detail: `${typeLabel}验证码`,
        ip: req.ip,
      });
    }
    // 注册场景：不记 UserActivityLog（用户尚不存在），EmailLog/VerificationToken 已提供审计链

    res.json(success(null, '验证码已发送'));
  } catch (error: any) {
    if (existingUserId) {
      logUserActivity({
        userId: existingUserId,
        action: 'sendVerifyCode_failed',
        targetId: target,
        detail: `${typeLabel}验证码发送失败: ${error.message}`,
        ip: req.ip,
      });
    }
    res.status(400).json(badRequest(error.message || '验证码发送失败'));
  }
}

export async function accountRegister(req: Request, res: Response) {
  return registerAccount(req, res, true);
}

async function registerAccount(req: Request, res: Response, requireCode: boolean) {
  const { email, phone } = resolveAccount(req.body);
  const { password, nickname } = req.body;
  const inputCode = String(req.body.verifyCode || req.body.code || '');

  if ((!email && !phone) || !password || (requireCode && !inputCode)) {
    res.status(400).json(badRequest(requireCode ? '账号、密码和验证码不能为空' : '账号和密码不能为空'));
    return;
  }

  if (String(password).length < 6) {
    res.status(400).json(badRequest('密码至少 6 位'));
    return;
  }

  // 已删用户释放 phone/email；活跃用户拒绝重复注册
  const existing = email
    ? await prisma.user.findUnique({ where: { email } })
    : await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    if (existing.deletedAt) {
      // 释放已注销用户的手机号/邮箱
      await prisma.user.update({
        where: { id: existing.id },
        data: { email: email ? null : existing.email, phone: phone ? null : existing.phone },
      });
    } else {
      res.status(400).json(badRequest('账号已注册'));
      return;
    }
  }

  try {
    if (requireCode) {
      await verifyCode({ email, phone, code: inputCode, type: 'REGISTER' });
    }
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        password: bcrypt.hashSync(password, 10),
        nickname: nickname || (email ? email.split('@')[0] : `User${String(phone).slice(-4)}`),
        lastLoginAt: new Date(),
        lastLoginIp: req.ip,
        lastLoginPlatform: 'APP',
      },
    });

    await ensureDefaultCollection(user.id);
    const token = generateToken(user);
    logUserActivity({ userId: user.id, action: 'register', detail: email ? '邮箱注册' : '手机号注册', ip: req.ip });
    res.json(success({ token, ...mapAuthUser(user) }, '注册成功'));
  } catch (error: any) {
    res.status(400).json(badRequest(error.message || '注册失败'));
  }
}

export async function accountLogin(req: Request, res: Response) {
  const { email, phone } = resolveAccount(req.body);
  const { password } = req.body;

  if ((!email && !phone) || !password) {
    res.status(400).json(badRequest('账号和密码不能为空'));
    return;
  }

  const user = email
    ? await prisma.user.findFirst({ where: { email, deletedAt: null } })
    : await prisma.user.findFirst({ where: { phone, deletedAt: null } });

  if (!user || !user.password || !bcrypt.compareSync(password, user.password)) {
    res.status(401).json(unauthorized('账号或密码错误'));
    return;
  }

  if (user.status !== 'ACTIVE') {
    res.status(403).json(badRequest('账号已被冻结，请联系客服'));
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
  logUserActivity({ userId: updated.id, action: 'login', detail: email ? '邮箱登录' : '手机号登录', ip: req.ip });
  res.json(success({ token, ...mapAuthUser(updated) }, '登录成功'));
}

export async function resetPassword(req: Request, res: Response) {
  const { email, phone } = resolveAccount(req.body);
  const { newPassword } = req.body;
  const inputCode = String(req.body.verifyCode || req.body.code || '');

  if ((!email && !phone) || !inputCode || !newPassword) {
    res.status(400).json(badRequest('账号、验证码和新密码不能为空'));
    return;
  }

  if (String(newPassword).length < 6) {
    res.status(400).json(badRequest('新密码至少 6 位'));
    return;
  }

  const user = email
    ? await prisma.user.findUnique({ where: { email } })
    : await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    res.status(404).json(badRequest('账号不存在'));
    return;
  }

  try {
    await verifyCode({ email, phone, code: inputCode, type: 'RESETPASSWORD' });
    await prisma.user.update({
      where: { id: user.id },
      data: { password: bcrypt.hashSync(newPassword, 10) },
    });
    logUserActivity({ userId: user.id, action: 'resetPassword', detail: '验证码重置密码', ip: req.ip });
    res.json(success(null, '密码已重置'));
  } catch (error: any) {
    res.status(400).json(badRequest(error.message || '密码重置失败'));
  }
}

export async function phoneRegister(req: Request, res: Response) {
  return registerAccount(req, res, false);
}

export async function phoneLogin(req: Request, res: Response) {
  return accountLogin(req, res);
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

    let user = await prisma.user.findFirst({
      where: { openid: session.openid, deletedAt: null },
    });

    if (!user) {
      // 若该 openid 存在但已被软删，清理旧记录以便重新注册
      const deleted = await prisma.user.findUnique({
        where: { openid: session.openid },
      });
      if (deleted?.deletedAt) {
        await prisma.user.update({
          where: { id: deleted.id },
          data: { openid: null, email: null, phone: null },
        });
      }
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
    logUserActivity({ userId: user.id, action: 'wxLogin', detail: '微信登录', ip: req.ip });
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

export async function bindEmail(req: Request, res: Response) {
  const userId = (req as any).userId;
  const email = normalizeEmail(req.body.email);
  const inputCode = String(req.body.verifyCode || req.body.code || '');

  if (!email || !inputCode) {
    res.status(400).json(badRequest('邮箱和验证码不能为空'));
    return;
  }

  try {
    await verifyCode({ email, code: inputCode, type: 'BIND' });
    const user = await prisma.user.update({
      where: { id: userId },
      data: { email },
    });
    logUserActivity({ userId, action: 'bindEmail', detail: `绑定邮箱 ${email}`, ip: req.ip });
    res.json(success(mapAuthUser(user), '邮箱已绑定'));
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json(badRequest('邮箱已被绑定'));
      return;
    }
    res.status(400).json(badRequest(error.message || '邮箱绑定失败'));
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
      email: true,
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
      hasEmail: !!user.email,
      hasPhone: !!user.phone,
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

  res.json(success(mapAuthUser(user), 'Updated'));
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

  logUserActivity({ userId, action: 'changePassword', detail: '修改密码', ip: req.ip });
  res.json(success(null, 'Password updated'));
}
