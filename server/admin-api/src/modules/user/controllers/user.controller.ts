import { Request, Response } from 'express';
import { paginated } from '../../../types/response';
import { NotFoundException } from '../../system/middleware/errorHandler';

export async function getUsers(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;

  // TODO: 使用 Prisma 查询用户列表
  // const [users, total] = await Promise.all([
  //   prisma.user.findMany({
  //     skip: (page - 1) * pageSize,
  //     take: pageSize,
  //     orderBy: { createdAt: 'desc' },
  //   }),
  //   prisma.user.count(),
  // ]);

  const mockUsers = [];
  res.json(paginated(mockUsers, { page, pageSize, total: 0 }));
}

export async function getUserById(req: Request, res: Response) {
  const { id } = req.params;
  // TODO: 使用 Prisma 查询用户详情
  // const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });
  // if (!user) throw new NotFoundException('用户不存在');
  res.json({ code: 200, message: 'success', data: null, timestamp: Date.now() });
}

export async function updateUserStatus(req: Request, res: Response) {
  const { id } = req.params;
  const { status } = req.body;
  // TODO: 更新用户状态
  res.json({ code: 200, message: '状态更新成功', timestamp: Date.now() });
}
