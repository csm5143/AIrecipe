import { NotificationType } from '@prisma/client';
import { prisma } from '../lib/prisma';

interface CreateNotificationParams {
  userId: number;
  type: NotificationType;
  title: string;
  content: string;
  data?: Record<string, any>;
}

/**
 * 创建通知 — fire-and-forget 模式
 * 通知发送失败不影响主操作（如审核、关注、点赞）
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  if (!params.userId || params.userId <= 0) return;

  try {
    await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        content: params.content,
        data: params.data ?? undefined,
      },
    });
  } catch (error) {
    console.error('[NotificationService] 创建通知失败:', error);
  }
}
