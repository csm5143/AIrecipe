import { Request, Response } from 'express';
import { paginated, success, badRequest, notFound } from '../../../types/response';
import { prisma } from '../../../lib/prisma';
import { getAdminId, getAdminName, createOperationLog, addToRecycleBin } from '../../../utils/adminHelper';
import { AccountStatus } from '@prisma/client';
import { exportUsers } from '../../../services/export.service';

// 小冰箱相关
export async function addUserFridgeItem(req: Request, res: Response) {
  const userId = parseInt(req.params.userId);
  const { name, amount, unit, category } = req.body;

  if (!name?.trim()) {
    res.status(400).json(badRequest('食材名称不能为空'));
    return;
  }

  const item = await prisma.fridgeItem.upsert({
    where: { userId_name: { userId, name: name.trim() } },
    update: { amount: amount || undefined, unit: unit || undefined },
    create: { userId, name: name.trim(), amount: amount || null, unit: unit || null, category: category || null },
  });

  res.json(success(item, '食材已添加'));
}

export async function deleteUserFridgeItem(req: Request, res: Response) {
  const id = parseInt(req.params.fridgeId);
  await prisma.fridgeItem.delete({ where: { id } });
  res.json(success(null, '食材已删除'));
}

export async function getUserShoppingLists(req: Request, res: Response) {
  const userId = parseInt(req.params.userId);
  const lists = await prisma.shoppingList.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: { orderBy: { createdAt: 'asc' } },
    },
  });
  res.json(success(lists));
}

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
  // 兼容前端传的 lowercase 值（male/female）和数据库 uppercase 值（MALE/FEMALE）
  if (gender) {
    const normalized = gender.toUpperCase();
    if (normalized === 'MALE' || normalized === 'FEMALE' || normalized === 'UNKNOWN') {
      where.gender = normalized;
    }
  }
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
        bio: true,
        createdAt: true,
        lastLoginAt: true,
        _count: { select: { feedbacks: true } },
        collections: { select: { items: { select: { id: true } } } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const list = users.map(u => ({
    ...u,
    collectionCount: u.collections.reduce((sum, c) => sum + c.items.length, 0),
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
    include: {
      collections: {
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { items: true } },
          items: {
            take: 50,
            orderBy: { createdAt: 'desc' },
            include: { recipe: { select: { id: true, title: true, coverImage: true } } },
          },
        },
      },
      fridgeItems: {
        take: 50,
        orderBy: { addedAt: 'desc' },
      },
      aiScans: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, imageUrl: true, status: true, createdAt: true },
      },
      browseHistory: {
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { recipe: { select: { id: true, title: true, coverImage: true } } },
      },
      feedbacks: {
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          replies: {
            orderBy: { createdAt: 'asc' },
            include: { admin: { select: { nickname: true } } },
          },
        },
      },
      notifications: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { feedbacks: true, fridgeItems: true, aiScans: true } },
    },
  });
  if (!user) {
    res.status(404).json(notFound('用户不存在'));
    return;
  }
  // 从所有收藏夹中提取收藏的菜谱（去重）
  const allCollectedRecipes = new Map<number, any>();
  user.collections.forEach(c => {
    c.items.forEach(item => {
      if (item.recipe && !allCollectedRecipes.has(item.recipe.id)) {
        allCollectedRecipes.set(item.recipe.id, {
          id: item.id,
          recipeId: item.recipe.id,
          recipeTitle: item.recipe.title || '',
          recipeCover: item.recipe.coverImage || '',
          createdAt: item.createdAt.getTime(),
        });
      }
    });
  });

  const totalCollectionItems = user.collections.reduce((sum, c) => sum + c.items.length, 0);

  res.json(success({
    id: user.id,
    nickname: user.nickname,
    avatar: user.avatar,
    phone: user.phone,
    gender: user.gender,
    status: user.status,
    bio: user.bio,
    createdAt: user.createdAt.toISOString().slice(0, 16).replace('T', ' '),
    lastLoginAt: user.lastLoginAt?.toISOString().slice(0, 16).replace('T', ' ') || '',
    collectionCount: totalCollectionItems,
    feedbackCount: user._count.feedbacks,
    fridgeCount: user._count.fridgeItems,
    aiScanCount: user._count.aiScans,
    favorites: Array.from(allCollectedRecipes.values()),
    collections: user.collections.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      coverImage: c.coverImage,
      isPublic: c.isPublic,
      itemCount: c.items.length,
      createdAt: c.createdAt.toISOString().slice(0, 16).replace('T', ' '),
    })),
    fridgeItems: user.fridgeItems.map(fi => ({
      id: fi.id,
      name: fi.name,
      amount: fi.amount,
      unit: fi.unit,
      category: fi.category,
      addedAt: fi.addedAt.getTime(),
    })),
    aiScans: user.aiScans.map(s => ({
      id: s.id,
      imageUrl: s.imageUrl,
      status: s.status,
      createdAt: s.createdAt.toISOString().slice(0, 16).replace('T', ' '),
    })),
    browseHistory: user.browseHistory.map(bh => ({
      id: bh.id,
      recipeId: bh.recipeId,
      recipeTitle: bh.recipe?.title || '',
      recipeCover: bh.recipe?.coverImage || '',
      createdAt: bh.createdAt.getTime(),
    })),
    notifications: user.notifications.map(n => ({
      id: n.id,
      title: n.title,
      content: n.content,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString().slice(0, 16).replace('T', ' '),
    })),
    feedbacks: user.feedbacks.map(f => ({
      id: f.id,
      type: f.type,
      content: f.content,
      contact: f.contact || '',
      images: (f.images as string[]) || [],
      status: f.status,
      createdAt: f.createdAt.toISOString().slice(0, 16).replace('T', ' '),
      replies: (f.replies || []).map(r => ({
        id: r.id,
        adminName: r.admin?.nickname || '管理员',
        content: r.content,
        createdAt: r.createdAt.toISOString().slice(0, 16).replace('T', ' '),
      })),
    })),
  }));
}

export async function updateUserStatus(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  await prisma.user.update({ where: { id, deletedAt: null }, data: { status } });
  await createOperationLog(getAdminId(req), getAdminName(req), 'update', 'user', String(id), `更新用户「${id}」状态为 ${status}`, req.ip || undefined);
  res.json(success(null, '状态更新成功'));
}

interface UpdateUserBody {
  nickname?: string;
  phone?: string;
  gender?: string;
  avatar?: string;
  bio?: string;
}

export async function updateUser(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  const { nickname, phone, gender, avatar, bio } = req.body as UpdateUserBody;

  const existing = await prisma.user.findUnique({ where: { id, deletedAt: null } });
  if (!existing) {
    res.status(404).json(notFound('用户不存在'));
    return;
  }

  const data: any = {};
  if (nickname !== undefined) data.nickname = nickname;
  if (avatar !== undefined) data.avatar = avatar;
  if (bio !== undefined) data.bio = bio;
  if (gender !== undefined) {
    const upper = gender.toUpperCase();
    data.gender = ['MALE', 'FEMALE', 'UNKNOWN'].includes(upper) ? upper : 'UNKNOWN';
  }
  if (phone !== undefined) data.phone = phone;

  const updated = await prisma.user.update({ where: { id }, data });
  await createOperationLog(getAdminId(req), getAdminName(req), 'update', 'user', String(id), `管理员更新用户「${existing.nickname || id}」资料`, req.ip || undefined);
  res.json(success({
    id: updated.id,
    nickname: updated.nickname,
    avatar: updated.avatar,
    phone: updated.phone,
    gender: updated.gender,
    bio: updated.bio,
  }, '更新成功'));
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
