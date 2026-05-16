import { Request, Response } from 'express';
import { paginated, success, notFound } from '../../../types/response';
import { prisma } from '../../../lib/prisma';
import { FeedbackStatus, FeedbackType } from '@prisma/client';
import { getAdminId, getAdminName, createOperationLog, addToRecycleBin } from '../../../utils/adminHelper';

const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  BUG_REPORT: 'Bug反馈',
  FEATURE_REQUEST: '功能建议',
  CONTENT_ISSUE: '内容纠错',
  IMPROVEMENT: '改进建议',
  OTHER: '其他问题',
};

const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = {
  PENDING: '待处理',
  IN_PROGRESS: '处理中',
  REPLIED: '已回复',
  RESOLVED: '已解决',
  CLOSED: '已关闭',
};

export async function getFeedbacks(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const type = req.query.type as string;
  const status = req.query.status as string;
  const keyword = req.query.keyword as string;

  const where: any = {};
  if (type) where.type = type;
  if (status) where.status = status;
  if (keyword) where.content = { contains: keyword, mode: 'insensitive' };

  const [feedbacks, total] = await Promise.all([
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

  const list = feedbacks.map(f => ({
    id: f.id,
    userIdentifier: f.userId?.toString() || '',
    userType: f.userId ? 'user' : 'guest',
    nickname: f.user?.nickname || '匿名用户',
    avatar: f.user?.avatar || '',
    type: f.type.toLowerCase() as FeedbackType,
    typeLabel: FEEDBACK_TYPE_LABELS[f.type],
    content: f.content,
    contact: f.contact || '',
    images: (f.images as string[]) || [],
    cloudImageUrls: [],
    createTime: f.createdAt.getTime(),
    status: f.status.toLowerCase() as FeedbackStatus,
    statusText: FEEDBACK_STATUS_LABELS[f.status],
    appVersion: '',
    phoneModel: '',
    systemInfo: '',
    reply: f.replies.map(r => ({
      id: r.id,
      adminId: r.adminId || 0,
      adminName: r.admin?.nickname || '管理员',
      content: r.content,
      createTime: r.createdAt.getTime(),
    })),
  }));

  res.json(paginated(list, { page, pageSize, total }));
}

export async function replyFeedback(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  const { content } = req.body;
  const adminId = getAdminId(req);

  await prisma.feedbackReply.create({
    data: { feedbackId: id, adminId, content },
  });
  await createOperationLog(adminId, getAdminName(req), 'update', 'feedback', String(id), `回复了反馈「${content.slice(0, 20)}...」`, req.ip || undefined);
  res.json(success(null, '回复成功'));
}

export async function updateFeedbackStatus(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  await prisma.feedback.update({ where: { id }, data: { status: status.toUpperCase() } });
  await createOperationLog(getAdminId(req), getAdminName(req), 'update', 'feedback', String(id), `更新反馈「${id}」状态为 ${status}`, req.ip || undefined);
  res.json(success(null, '状态更新成功'));
}

export async function deleteFeedback(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  const existing = await prisma.feedback.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json(notFound('反馈不存在'));
    return;
  }
  await prisma.feedback.delete({ where: { id } });
  await addToRecycleBin(getAdminId(req), 'feedback', id, existing, undefined, 30);
  await createOperationLog(getAdminId(req), getAdminName(req), 'delete', 'feedback', String(id), `删除了反馈「${existing.content.slice(0, 30)}...」`, req.ip || undefined);
  res.json(success(null, '删除成功'));
}
