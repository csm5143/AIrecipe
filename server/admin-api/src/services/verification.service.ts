import { VerificationType } from '@prisma/client';
import { prisma } from '../lib/prisma';

const CODE_TTL_MS = 5 * 60 * 1000;
const RESEND_WINDOW_MS = 60 * 1000;
const MAX_ATTEMPTS = 3;

export function normalizeVerificationType(type: string): VerificationType {
  const normalized = String(type || '').toLowerCase();
  if (normalized === 'register') return 'REGISTER';
  if (normalized === 'resetpassword' || normalized === 'reset_password') return 'RESETPASSWORD';
  if (normalized === 'bind') return 'BIND';
  if (normalized === 'admin_reset' || normalized === 'adminreset') return 'ADMIN_RESET';
  return 'REGISTER';
}

export function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function createVerificationCode(params: {
  userId?: number;
  email?: string;
  phone?: string;
  type: VerificationType;
}) {
  const targetWhere = params.email
    ? { email: params.email }
    : { phone: params.phone };

  const recent = await prisma.verificationToken.findFirst({
    where: {
      ...targetWhere,
      type: params.type,
      usedAt: null,
      createdAt: { gte: new Date(Date.now() - RESEND_WINDOW_MS) },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (recent) {
    throw new Error('验证码发送过于频繁，请稍后再试');
  }

  const code = generateCode();
  await prisma.verificationToken.create({
    data: {
      userId: params.userId,
      email: params.email,
      phone: params.phone,
      code,
      type: params.type,
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    },
  });
  return code;
}

export async function verifyCode(params: {
  email?: string;
  phone?: string;
  code: string;
  type: VerificationType;
  userId?: number;
}) {
  const targetWhere = params.email
    ? { email: params.email }
    : { phone: params.phone };

  const token = await prisma.verificationToken.findFirst({
    where: {
      ...targetWhere,
      ...(params.userId ? { userId: params.userId } : {}),
      type: params.type,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!token) {
    throw new Error('验证码无效或已过期');
  }

  if (token.attempts >= MAX_ATTEMPTS) {
    await prisma.verificationToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() },
    });
    throw new Error('验证码已失效，请重新获取');
  }

  if (token.code !== params.code) {
    const attempts = token.attempts + 1;
    await prisma.verificationToken.update({
      where: { id: token.id },
      data: {
        attempts,
        ...(attempts >= MAX_ATTEMPTS ? { usedAt: new Date() } : {}),
      },
    });
    throw new Error(attempts >= MAX_ATTEMPTS ? '验证码错误次数过多，请重新获取' : '验证码错误');
  }

  await prisma.verificationToken.update({
    where: { id: token.id },
    data: { usedAt: new Date() },
  });
}

export async function cleanupExpiredVerificationTokens() {
  await prisma.verificationToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { usedAt: { not: null } },
      ],
    },
  });
}
