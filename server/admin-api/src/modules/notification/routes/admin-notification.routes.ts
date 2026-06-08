import { Router, Router as ExpressRouter } from 'express';
import { NotificationType } from '@prisma/client';
import { asyncHandler } from '../../../utils/helper';
import { prisma } from '../../../lib/prisma';
import { createNotification } from '../../../services/notification.service';
import { authenticate, authorize } from '../../auth/middleware/auth.middleware';
import { badRequest, notFound, paginated, success } from '../../../types/response';

const router: ExpressRouter = Router();

router.use(asyncHandler(authenticate));
router.use(asyncHandler(authorize('SUPER_ADMIN', 'ADMIN')));

function normalizeType(value: unknown): NotificationType | undefined {
  if (!value) return undefined;
  const type = String(value).toUpperCase() as NotificationType;
  return ['SYSTEM', 'ANNOUNCEMENT'].includes(type) ? type : undefined;
}

function mapNotification(item: any) {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    content: item.content,
    userId: item.userId,
    receiverName: item.user?.nickname || '',
    receiverAvatar: item.user?.avatar || '',
    isRead: item.isRead,
    readAt: item.readAt?.getTime?.() || null,
    createdAt: item.createdAt.getTime(),
    data: item.data || {},
  };
}

router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);
  const type = normalizeType(req.query.type);
  const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;

  const where: any = {};
  if (type) where.type = type;
  if (userId) where.userId = userId;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { nickname: true, avatar: true } } },
    }),
    prisma.notification.count({ where }),
  ]);

  res.json(paginated(notifications.map(mapNotification), { page, pageSize, total }));
}));

router.post('/send', asyncHandler(async (req, res) => {
  const type = normalizeType(req.body.type);
  const title = String(req.body.title || '').trim();
  const content = String(req.body.content || '').trim();
  const rawUserIds = Array.isArray(req.body.userIds) ? req.body.userIds : [];
  const userIds = rawUserIds
    .map((id: any) => parseInt(String(id)))
    .filter((id: number) => Number.isInteger(id) && id > 0);

  if (!type || !title || !content) {
    res.status(400).json(badRequest('缺少通知类型、标题或内容'));
    return;
  }

  const targets: number[] = userIds.length
    ? userIds
    : (await prisma.user.findMany({
        where: { deletedAt: null, status: 'ACTIVE' },
        select: { id: true },
      })).map(user => user.id);
  const uniqueTargets = Array.from(new Set<number>(targets));

  await Promise.all(
    uniqueTargets.map(userId =>
      createNotification({
        userId,
        type,
        title,
        content,
        data: { source: 'admin' },
      }),
    ),
  );

  res.json(success({ count: uniqueTargets.length }, '发送成功'));
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const existing = await prisma.notification.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json(notFound('通知不存在'));
    return;
  }

  await prisma.notification.delete({ where: { id } });
  res.json(success(null, '删除成功'));
}));

export default router;
