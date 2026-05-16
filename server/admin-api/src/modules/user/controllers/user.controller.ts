import { Request, Response } from 'express';
import { paginated, success, badRequest, notFound } from '../../../types/response';
import { prisma } from '../../../lib/prisma';
import { getAdminId, getAdminName, createOperationLog, addToRecycleBin } from '../../../utils/adminHelper';
import { AccountStatus } from '@prisma/client';
import { exportUsers } from '../../../services/export.service';

export async function getUsers(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const keyword = req.query.keyword as string;
  const gender = req.query.gender as string;
  const status = req.query.status as string;

  const where: any = { deletedAt: null };
  if (keyword) {
    where.OR = [
      { nickname: { contains: keyword, mode: 'insensitive' } },
      { phone: { contains: keyword } },
    ];
  }
  if (gender) where.gender = gender;
  if (status) where.status = status;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        nickname: true,
        avatar: true,
        phone: true,
        gender: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
        _count: { select: { feedbacks: true, favorites: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const list = users.map(u => ({
    ...u,
    collectionCount: u._count.favorites,
    feedbackCount: u._count.feedbacks,
    createdAt: u.createdAt.toISOString().slice(0, 16).replace('T', ' '),
    lastLoginAt: u.lastLoginAt?.toISOString().slice(0, 16).replace('T', ' ') || '',
  }));

  res.json(paginated(list, { page, pageSize, total }));
}

export async function getUserById(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  const user = await prisma.user.findUnique({
    where: { id, deletedAt: null },
    select: {
      id: true,
      nickname: true,
      avatar: true,
      phone: true,
      gender: true,
      status: true,
      createdAt: true,
      lastLoginAt: true,
      _count: { select: { feedbacks: true, favorites: true } },
    },
  });
  if (!user) {
    res.status(404).json(notFound('用户不存在'));
    return;
  }
  res.json(success({
    ...user,
    collectionCount: user._count.favorites,
    feedbackCount: user._count.feedbacks,
    createdAt: user.createdAt.toISOString().slice(0, 16).replace('T', ' '),
    lastLoginAt: user.lastLoginAt?.toISOString().slice(0, 16).replace('T', ' ') || '',
  }));
}

export async function updateUserStatus(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  await prisma.user.update({ where: { id, deletedAt: null }, data: { status } });
  await createOperationLog(getAdminId(req), getAdminName(req), 'update', 'user', String(id), `更新用户「${id}」状态为 ${status}`, req.ip || undefined);
  res.json(success(null, '状态更新成功'));
}

export async function deleteUser(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  const existing = await prisma.user.findUnique({ where: { id, deletedAt: null } });
  if (!existing) {
    res.status(404).json(notFound('用户不存在'));
    return;
  }
  await prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
  await addToRecycleBin(getAdminId(req), 'user', id, existing, undefined, 30);
  await createOperationLog(getAdminId(req), getAdminName(req), 'delete', 'user', existing.nickname || String(id), `删除了用户「${existing.nickname || id}」`, req.ip || undefined);
  res.json(success(null, '删除成功'));
}

interface CreateUserBody {
  nickname?: string;
  phone?: string;
  password?: string;
  gender?: 'MALE' | 'FEMALE' | 'UNKNOWN';
  avatar?: string;
  bio?: string;
}

export async function createUser(req: Request, res: Response) {
  const { nickname, phone, password, gender, avatar, bio } = req.body as CreateUserBody;

  if (!phone && !nickname) {
    res.status(400).json(badRequest('手机号或昵称至少填写一项'));
    return;
  }

  if (phone) {
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      res.status(409).json(badRequest('该手机号已被注册'));
      return;
    }
  }

  const user = await prisma.user.create({
    data: {
      nickname: nickname || null,
      phone: phone || null,
      password: password || null,
      gender: gender || 'UNKNOWN',
      avatar: avatar || null,
      bio: bio || null,
      status: 'ACTIVE' as AccountStatus,
    },
  });

  await createOperationLog(
    getAdminId(req), getAdminName(req), 'create', 'user',
    nickname || phone || String(user.id),
    `管理员新增用户「${nickname || phone || user.id}」`, req.ip || undefined
  );

  res.json(success({ id: user.id, nickname: user.nickname, phone: user.phone }, '用户创建成功'));
}

export async function exportUsersHandler(req: Request, res: Response) {
  const format = req.query.format as string;
  if (format && !['csv', 'xlsx', 'json'].includes(format)) {
    res.status(400).json(badRequest('format 参数仅支持 csv、xlsx 或 json'));
    return;
  }

  const keyword = req.query.keyword as string;
  const gender = req.query.gender as string;
  const status = req.query.status as string;

  const where: any = { deletedAt: null };
  if (keyword) {
    where.OR = [
      { nickname: { contains: keyword, mode: 'insensitive' } },
      { phone: { contains: keyword } },
    ];
  }
  if (gender) where.gender = gender;
  if (status) where.status = status;

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, nickname: true, avatar: true, phone: true, gender: true,
      birthday: true, bio: true, status: true, lastLoginPlatform: true,
      lastLoginIp: true, lastLoginAt: true, createdAt: true,
      _count: { select: { feedbacks: true, favorites: true } },
    },
  });

  const rows = users.map(u => ({
    id: u.id,
    nickname: u.nickname || '',
    avatar: u.avatar || '',
    phone: u.phone || '',
    gender: u.gender || 'UNKNOWN',
    birthday: u.birthday || null,
    bio: u.bio || '',
    status: u.status,
    platform: u.lastLoginPlatform || '',
    lastLoginIp: u.lastLoginIp || '',
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
    collectionCount: u._count.favorites,
    feedbackCount: u._count.feedbacks,
  }));

  const fmt = (format === 'csv' || format === 'json') ? format : 'xlsx';
  exportUsers(res, fmt, rows);
}
