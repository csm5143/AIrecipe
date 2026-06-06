import { Router, Router as ExpressRouter } from 'express';
import { asyncHandler } from '../../../utils/helper';
import { wxAuthenticate } from '../../wx/middleware/wxAuth.middleware';
import { prisma } from '../../../lib/prisma';
import { success, paginated, badRequest } from '../../../types/response';

const router: ExpressRouter = Router();

// 所有路由需要微信用户认证
router.use(wxAuthenticate);

// GET / — 分页获取当前用户的的通知列表
router.get('/', asyncHandler(async (req, res) => {
  const userId = (req as any).userId;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);

  const [list, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.notification.count({ where: { userId } }),
  ]);

  const formatted = list.map(item => ({
    id: item.id,
    type: item.type,
    title: item.title,
    content: item.content,
    data: item.data,
    isRead: item.isRead,
    readAt: item.readAt ? item.readAt.getTime() : null,
    createdAt: item.createdAt.getTime(),
  }));

  res.json(paginated(formatted, { page, pageSize, total }));
}));

// GET /unread-count — 轻量未读计数（用于角标）
router.get('/unread-count', asyncHandler(async (req, res) => {
  const userId = (req as any).userId;
  const count = await prisma.notification.count({
    where: { userId, isRead: false },
  });
  res.json(success({ count }));
}));

// PUT /read-all — 全部标记已读
router.put('/read-all', asyncHandler(async (req, res) => {
  const userId = (req as any).userId;
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  res.json(success(null, '已全部标记为已读'));
}));

// PUT /:id/read — 标记单条已读
router.put('/:id/read', asyncHandler(async (req, res) => {
  const userId = (req as any).userId;
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    res.status(400).json(badRequest('无效的通知 ID'));
    return;
  }

  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== userId) {
    res.status(404).json({ code: 404, message: '通知不存在', timestamp: Date.now() });
    return;
  }

  await prisma.notification.update({
    where: { id },
    data: { isRead: true, readAt: new Date() },
  });
  res.json(success(null, '已标记为已读'));
}));

// DELETE /:id — 删除单条通知
router.delete('/:id', asyncHandler(async (req, res) => {
  const userId = (req as any).userId;
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    res.status(400).json(badRequest('无效的通知 ID'));
    return;
  }

  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== userId) {
    res.status(404).json({ code: 404, message: '通知不存在', timestamp: Date.now() });
    return;
  }

  await prisma.notification.delete({ where: { id } });
  res.json(success(null, '已删除'));
}));

export default router;
