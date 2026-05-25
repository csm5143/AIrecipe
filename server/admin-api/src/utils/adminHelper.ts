import { prisma } from '../lib/prisma';
import { Request } from 'express';

export function getAdminId(req: Request): number {
  return (req as any).admin?.id || 0;
}

export function getAdminName(req: Request): string {
  return (req as any).admin?.username || (req as any).admin?.nickname || '未知';
}

export async function createOperationLog(
  adminId: number,
  adminName: string,
  action: string,
  module: string,
  target: string,
  detail: string,
  ip?: string
) {
  await prisma.operationLog.create({
    data: {
      adminId,
      action,
      module,
      targetId: target,
      detail: { message: detail },
      ip: ip || null,
    },
  });
}

export async function addToRecycleBin(
  adminId: number,
  itemType: string,
  itemId: number,
  itemData: any,
  reason?: string,
  expiresDays = 30,
  tx?: any
) {
  const client = tx || prisma;
  await client.recycleBin.create({
    data: {
      itemType,
      itemId,
      itemData,
      deletedBy: adminId,
      reason,
      expiresAt: new Date(Date.now() + expiresDays * 86400000),
    },
  });
}
