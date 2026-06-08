import { prisma } from '../lib/prisma';

/**
 * 记录用户活动日志（fire-and-forget）
 */
export async function logUserActivity(params: {
  userId: number;
  action: string;
  targetId?: string;
  detail?: string;
  ip?: string;
  userAgent?: string;
}) {
  if (!params.userId || params.userId <= 0) return;
  try {
    await prisma.userActivityLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        targetId: params.targetId || null,
        detail: params.detail || null,
        ip: params.ip || null,
        userAgent: params.userAgent || null,
      },
    });
  } catch (error) {
    console.error('[ActivityLog] 记录用户活动失败:', error);
  }
}
