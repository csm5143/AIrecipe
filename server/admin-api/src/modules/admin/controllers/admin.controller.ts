import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../lib/prisma';
import { paginated, success, notFound, badRequest } from '../../../types/response';
import { getAdminId, getAdminName, createOperationLog, addToRecycleBin } from '../../../utils/adminHelper';

function safeAdmin(admin: any) {
  const { password: _, ...prismaSafe } = admin;
  return prismaSafe;
}

const baseWhere = { isDeleted: false };

export async function getAdmins(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const keyword = req.query.keyword as string;

  const where: any = { ...baseWhere };
  if (keyword) {
    where.OR = [
      { username: { contains: keyword, mode: 'insensitive' } },
      { nickname: { contains: keyword, mode: 'insensitive' } },
    ];
  }

  const [total, list] = await Promise.all([
    prisma.admin.count({ where }),
    prisma.admin.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const mapped = list.map(a => safeAdmin(a));
  res.json(paginated(mapped, { page, pageSize, total }));
}

export async function getAdminById(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json(badRequest('无效的管理员 ID'));
    return;
  }

  const admin = await prisma.admin.findUnique({ where: { id, ...baseWhere } });
  if (!admin) {
    res.status(404).json(notFound('管理员不存在'));
    return;
  }

  res.json(success(safeAdmin(admin)));
}

export async function createAdmin(req: Request, res: Response) {
  const { username, password, nickname, role, status } = req.body;

  if (!username || !password) {
    res.status(400).json(badRequest('用户名和密码不能为空'));
    return;
  }

  const existing = await prisma.admin.findUnique({ where: { username } });
  if (existing) {
    res.status(400).json(badRequest('用户名已存在'));
    return;
  }

  const passwordHash = bcrypt.hashSync(password, 10);

  const admin = await prisma.admin.create({
    data: {
      username,
      password: passwordHash,
      nickname: nickname || username,
      role: role || 'ADMIN',
      status: status || 'ACTIVE',
    },
  });

  await createOperationLog(getAdminId(req), getAdminName(req), 'create', 'admin', username, `新增管理员「${username}」`, req.ip || undefined);

  res.json(success(safeAdmin(admin), '管理员创建成功'));
}

export async function updateAdmin(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json(badRequest('无效的管理员 ID'));
    return;
  }

  const existing = await prisma.admin.findUnique({ where: { id, ...baseWhere } });
  if (!existing) {
    res.status(404).json(notFound('管理员不存在'));
    return;
  }

  const { nickname, role, status } = req.body;

  const updated = await prisma.admin.update({
    where: { id },
    data: {
      ...(nickname !== undefined && { nickname }),
      ...(role !== undefined && { role }),
      ...(status !== undefined && { status }),
    },
  });

  await createOperationLog(getAdminId(req), getAdminName(req), 'update', 'admin', existing.username, `更新了管理员「${existing.username}」的资料`, req.ip || undefined);

  res.json(success(safeAdmin(updated), '更新成功'));
}

export async function resetAdminPassword(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json(badRequest('无效的管理员 ID'));
    return;
  }

  const existing = await prisma.admin.findUnique({ where: { id, ...baseWhere } });
  if (!existing) {
    res.status(404).json(notFound('管理员不存在'));
    return;
  }

  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    res.status(400).json(badRequest('新密码长度不能少于 6 位'));
    return;
  }

  const passwordHash = bcrypt.hashSync(newPassword, 10);
  await prisma.admin.update({
    where: { id },
    data: { password: passwordHash },
  });

  res.json(success(null, '密码重置成功'));
}

export async function deleteAdmin(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json(badRequest('无效的管理员 ID'));
    return;
  }

  const currentAdminId = (req as any).admin?.id;
  if (!currentAdminId) {
    res.status(401).json(badRequest('未登录'));
    return;
  }

  // 不能删除自己
  if (id === currentAdminId) {
    res.status(400).json(badRequest('不能删除自己的账号'));
    return;
  }

  const existing = await prisma.admin.findUnique({ where: { id, ...baseWhere } });
  if (!existing) {
    res.status(404).json(notFound('管理员不存在'));
    return;
  }

  if (existing.role === 'SUPER_ADMIN') {
    res.status(400).json(badRequest('不能删除超级管理员'));
    return;
  }

  // 软删除：只标记 isDeleted = true
  await prisma.admin.update({
    where: { id },
    data: { isDeleted: true },
  });

  // 清理该管理员在回收站的记录（防止重复入站）
  await prisma.recycleBin.deleteMany({
    where: { itemType: 'admin', itemId: id },
  });

  const adminId = getAdminId(req);
  const adminName = getAdminName(req);
  await addToRecycleBin(adminId, 'admin', id, existing, undefined, 30);
  await createOperationLog(adminId, adminName, 'delete', 'admin', existing.username, `删除了管理员「${existing.username}」`, req.ip || undefined);

  res.json(success(null, '删除成功'));
}

export async function restoreAdmin(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json(badRequest('无效的管理员 ID'));
    return;
  }

  const existing = await prisma.admin.findUnique({ where: { id, isDeleted: true } });
  if (!existing) {
    res.status(404).json(notFound('管理员不存在或未被删除'));
    return;
  }

  // 恢复软删除记录
  await prisma.admin.update({
    where: { id },
    data: { isDeleted: false },
  });

  res.json(success(null, '还原成功'));
}
