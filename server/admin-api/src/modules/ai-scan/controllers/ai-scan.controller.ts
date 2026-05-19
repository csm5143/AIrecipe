import { Request, Response } from 'express';
import { paginated, success, notFound } from '../../../types/response';
import { prisma } from '../../../lib/prisma';
import { getAdminId, getAdminName, createOperationLog, addToRecycleBin } from '../../../utils/adminHelper';

const SCAN_STATUS_LABELS: Record<string, string> = {
  PROCESSING: '处理中',
  SUCCESS: '已完成',
  FAILED: '失败',
};

export async function getAiScans(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const status = req.query.status as string;
  const keyword = req.query.keyword as string;
  const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;

  const where: any = {};
  if (status) where.status = status.toUpperCase();
  if (userId) where.userId = userId;
  if (keyword) {
    where.OR = [
      { user: { nickname: { contains: keyword, mode: 'insensitive' } } },
      { user: { phone: { contains: keyword } } },
    ];
  }

  const [scans, total] = await Promise.all([
    prisma.aiScan.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, nickname: true, avatar: true, phone: true } },
      },
    }),
    prisma.aiScan.count({ where }),
  ]);

  const list = scans.map(s => ({
    id: s.id,
    userId: s.userId,
    nickname: s.user?.nickname || '未知用户',
    avatar: s.user?.avatar || '',
    phone: s.user?.phone || '',
    imageUrl: s.imageUrl,
    result: s.result as Record<string, any>,
    recipes: (s.recipes as any[]) || [],
    status: s.status.toLowerCase(),
    statusText: SCAN_STATUS_LABELS[s.status] || s.status,
    errorMsg: s.errorMsg || '',
    tokensUsed: s.tokensUsed ?? 0,
    apiKeyName: s.apiKeyName ?? '',
    model: s.model ?? '',
    createTime: s.createdAt.getTime(),
  }));

  res.json(paginated(list, { page, pageSize, total }));
}

export async function getAiScanById(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  const scan = await prisma.aiScan.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, nickname: true, avatar: true, phone: true } },
    },
  });

  if (!scan) {
    res.status(404).json(notFound('扫描记录不存在'));
    return;
  }

  res.json(success({
    id: scan.id,
    userId: scan.userId,
    nickname: scan.user?.nickname || '未知用户',
    avatar: scan.user?.avatar || '',
    phone: scan.user?.phone || '',
    imageUrl: scan.imageUrl,
    result: scan.result as Record<string, any>,
    recipes: (scan.recipes as any[]) || [],
    status: scan.status.toLowerCase(),
    statusText: SCAN_STATUS_LABELS[scan.status] || scan.status,
    errorMsg: scan.errorMsg || '',
    tokensUsed: scan.tokensUsed ?? 0,
    apiKeyName: scan.apiKeyName ?? '',
    model: scan.model ?? '',
    createTime: scan.createdAt.getTime(),
  }));
}

export async function updateAiScanStatus(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  const { status } = req.body;

  await prisma.aiScan.update({
    where: { id },
    data: { status: status.toUpperCase() },
  });

  await createOperationLog(
    getAdminId(req),
    getAdminName(req),
    'update',
    'aiScan',
    String(id),
    `更新扫描记录「${id}」状态为 ${SCAN_STATUS_LABELS[status.toUpperCase()] || status}`,
    req.ip || undefined
  );

  res.json(success(null, '状态更新成功'));
}

export async function deleteAiScan(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  const existing = await prisma.aiScan.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json(notFound('扫描记录不存在'));
    return;
  }

  await prisma.aiScan.delete({ where: { id } });
  await createOperationLog(
    getAdminId(req),
    getAdminName(req),
    'delete',
    'aiScan',
    String(id),
    `删除了扫描记录`,
    req.ip || undefined
  );

  res.json(success(null, '删除成功'));
}
