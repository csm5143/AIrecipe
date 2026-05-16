import { Request, Response } from 'express';
import { paginated, success } from '../../../types/response';
import { prisma } from '../../../lib/prisma';

export async function getOperationLogs(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const module = req.query.module as string;
  const action = req.query.action as string;
  const adminId = req.query.adminId as string;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  const where: any = {};
  if (module) where.module = module;
  if (action) where.action = action;
  if (adminId) where.adminId = parseInt(adminId);
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as any).gte = new Date(startDate);
    if (endDate) (where.createdAt as any).lte = new Date(endDate + 'T23:59:59');
  }

  const [logs, total] = await Promise.all([
    prisma.operationLog.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: { admin: { select: { id: true, nickname: true, username: true } } },
    }),
    prisma.operationLog.count({ where }),
  ]);

  const list = logs.map(log => ({
    id: log.id,
    adminId: log.adminId,
    adminName: log.admin?.nickname || log.admin?.username || '未知',
    action: log.action,
    module: log.module,
    target: log.targetId || '',
    detail: log.detail ? JSON.stringify(log.detail) : '',
    ip: log.ip || '',
    createdAt: log.createdAt.toISOString().slice(0, 19).replace('T', ' '),
  }));

  res.json(paginated(list, { page, pageSize, total }));
}
