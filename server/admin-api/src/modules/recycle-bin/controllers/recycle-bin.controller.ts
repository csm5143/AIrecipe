import { Request, Response } from 'express';
import { paginated, success, notFound } from '../../../types/response';
import { prisma } from '../../../lib/prisma';

// 记录操作日志
export async function createLog(adminId: number, adminName: string | null, action: string, module: string, target: string, detail: string, ip: string | null) {
  await prisma.operationLog.create({
    data: { adminId, action, module, targetId: target, detail: { message: detail }, ip },
  });
}

// 放入回收站
export async function addToRecycleBin(adminId: number, itemType: string, itemId: number, itemData: any, reason?: string, expiresDays?: number) {
  await prisma.recycleBin.create({
    data: {
      itemType,
      itemId,
      itemData,
      deletedBy: adminId,
      reason,
      expiresAt: expiresDays ? new Date(Date.now() + expiresDays * 86400000) : null,
    },
  });
}

export async function getRecycleBinItems(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const itemType = req.query.itemType as string;
  const keyword = req.query.keyword as string;

  const where: any = { restoredAt: null };
  if (itemType) where.itemType = itemType;
  if (keyword) {
    where.OR = [
      { itemData: { path: ['title'], string_contains: keyword } },
      { itemData: { path: ['nickname'], string_contains: keyword } },
      { itemData: { path: ['name'], string_contains: keyword } },
      { itemData: { path: ['username'], string_contains: keyword } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.recycleBin.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: { admin: { select: { nickname: true } } },
    }),
    prisma.recycleBin.count({ where }),
  ]);

  const list = items.map(item => ({
    id: item.id,
    itemType: item.itemType,
    itemId: item.itemId,
    itemData: item.itemData,
    deletedBy: item.deletedBy,
    adminName: item.admin?.nickname || '未知',
    reason: item.reason,
    createdAt: item.createdAt.toISOString().slice(0, 16).replace('T', ' '),
    expiresAt: item.expiresAt?.toISOString().slice(0, 16).replace('T', ' ') || null,
  }));

  res.json(paginated(list, { page, pageSize, total }));
}

export async function restoreItem(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  const item = await prisma.recycleBin.findUnique({ where: { id, restoredAt: null } });
  if (!item) {
    res.status(404).json(notFound('回收站项目不存在或已还原'));
    return;
  }

  const { itemType, itemId } = item;

  // 根据类型恢复数据
  if (itemType === 'recipe') {
    await prisma.recipe.update({ where: { id: itemId }, data: { isDeleted: false } });
  } else if (itemType === 'user') {
    await prisma.user.update({ where: { id: itemId }, data: { deletedAt: null } });
  } else if (itemType === 'admin') {
    // 软删除模式：恢复 isDeleted = false
    await prisma.admin.update({
      where: { id: itemId, isDeleted: true },
      data: { isDeleted: false },
    });
  }
  // feedback 和 ingredient 直接硬删，无须恢复

  await prisma.recycleBin.update({ where: { id }, data: { restoredAt: new Date() } });
  res.json(success(null, '还原成功'));
}

export async function permanentDelete(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  const item = await prisma.recycleBin.findUnique({ where: { id, restoredAt: null } });
  if (!item) {
    res.status(404).json(notFound('回收站项目不存在'));
    return;
  }

  const { itemType, itemId } = item;

  // 彻底删除
  if (itemType === 'recipe') {
    await prisma.recipe.delete({ where: { id: itemId } });
  } else if (itemType === 'user') {
    await prisma.user.delete({ where: { id: itemId } });
  } else if (itemType === 'feedback') {
    await prisma.feedback.delete({ where: { id: itemId } }).catch(() => {});
  } else if (itemType === 'ingredient') {
    await prisma.ingredient.delete({ where: { id: itemId } }).catch(() => {});
  } else if (itemType === 'admin') {
    // 软删除模式：永久删除 = 物理删除记录
    await prisma.admin.delete({ where: { id: itemId } }).catch(() => {});
  }

  await prisma.recycleBin.update({ where: { id }, data: { restoredAt: new Date() } });
  res.json(success(null, '永久删除成功'));
}
