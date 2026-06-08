import { NotificationType } from '@prisma/client';
import { createNotification } from './notification.service';
import { prisma } from '../lib/prisma';
import { hasTable } from './databaseCapability.service';

let timer: NodeJS.Timeout | null = null;
let running = false;
let unavailableLogged = false;

export async function processDueScheduledTasks() {
  if (running) return;
  running = true;
  try {
    if (!(await hasTable('scheduled_tasks'))) {
      if (!unavailableLogged) {
        console.warn('[Scheduler] scheduled_tasks 表不存在，已跳过提醒扫描；请执行 Prisma 迁移后重启服务。');
        unavailableLogged = true;
      }
      return;
    }

    const tasks = await (prisma as any).scheduledTask.findMany({
      where: {
        fired: false,
        triggerAt: { lte: new Date() },
      },
      orderBy: { triggerAt: 'asc' },
      take: 50,
    });

    for (const task of tasks) {
      try {
        await createNotification({
          userId: task.userId,
          type: NotificationType.SYSTEM,
          title: task.title,
          content: task.body,
          data: {
            scheduledTaskId: task.id,
            type: task.type,
            ...(task.data || {}),
          },
        });
        await (prisma as any).scheduledTask.update({
          where: { id: task.id },
          data: { fired: true, firedAt: new Date() },
        });
      } catch (err) {
        console.error('[Scheduler] 处理定时任务失败:', err);
      }
    }
  } finally {
    running = false;
  }
}

export function startScheduler() {
  if (timer) return;
  void processDueScheduledTasks();
  timer = setInterval(() => {
    void processDueScheduledTasks();
  }, 60_000);
  timer.unref?.();
  console.log('[Scheduler] 定时任务扫描器已启动');
}

export function stopScheduler() {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
}
