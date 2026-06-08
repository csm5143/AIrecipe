import { Router, Router as ExpressRouter } from 'express';
import { FeedbackStatus } from '@prisma/client';
import { asyncHandler } from '../../../utils/helper';
import { prisma } from '../../../lib/prisma';
import { authenticate, authorize } from '../../auth/middleware/auth.middleware';
import { badRequest, notFound, paginated, success } from '../../../types/response';

const router: ExpressRouter = Router();

router.use(asyncHandler(authenticate));
router.use(asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'AUDITOR')));

const REPORT_STATUS: FeedbackStatus[] = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

function normalizeStatus(value: unknown): FeedbackStatus | undefined {
  if (!value) return undefined;
  const status = String(value).toUpperCase() as FeedbackStatus;
  return REPORT_STATUS.includes(status) ? status : undefined;
}

function mapReport(report: any) {
  const images = Array.isArray(report.images) ? report.images : [];
  return {
    id: report.id,
    reporterId: report.userId,
    reporterName: report.user?.nickname || '匿名用户',
    reporterAvatar: report.user?.avatar || '',
    targetContentId: report.contact || '',
    type: report.type.toLowerCase(),
    reason: report.content,
    images,
    status: report.status.toLowerCase(),
    createdAt: report.createdAt.getTime(),
    updatedAt: report.updatedAt.getTime(),
    replies: report.replies?.map((reply: any) => ({
      id: reply.id,
      adminName: reply.admin?.nickname || '管理员',
      content: reply.content,
      createdAt: reply.createdAt.getTime(),
    })) || [],
  };
}

router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);
  const status = normalizeStatus(req.query.status);

  const where: any = { type: 'CONTENT_ISSUE' };
  if (status) where.status = status;

  const [reports, total] = await Promise.all([
    prisma.feedback.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { nickname: true, avatar: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: { admin: { select: { nickname: true } } },
        },
      },
    }),
    prisma.feedback.count({ where }),
  ]);

  res.json(paginated(reports.map(mapReport), { page, pageSize, total }));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const report = await prisma.feedback.findFirst({
    where: { id, type: 'CONTENT_ISSUE' },
    include: {
      user: { select: { nickname: true, avatar: true } },
      replies: {
        orderBy: { createdAt: 'asc' },
        include: { admin: { select: { nickname: true } } },
      },
    },
  });

  if (!report) {
    res.status(404).json(notFound('举报不存在'));
    return;
  }

  res.json(success(mapReport(report)));
}));

router.put('/:id/handle', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const status = normalizeStatus(req.body.status);
  if (!status || !['RESOLVED', 'CLOSED'].includes(status)) {
    res.status(400).json(badRequest('状态只能是 resolved 或 closed'));
    return;
  }

  const existing = await prisma.feedback.findFirst({ where: { id, type: 'CONTENT_ISSUE' } });
  if (!existing) {
    res.status(404).json(notFound('举报不存在'));
    return;
  }

  await prisma.feedback.update({ where: { id }, data: { status } });
  res.json(success(null, status === 'RESOLVED' ? '已标记处理' : '已忽略'));
}));

export default router;
