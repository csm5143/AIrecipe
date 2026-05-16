/**
 * 小程序用户端路由 - /api/v1/wx/user/*, /api/v1/wx/feedback, /api/v1/wx/collection
 * 无需 admin 认证，只需 wx 用户认证
 */

import { Router, Router as ExpressRouter } from 'express';
import { asyncHandler } from '../../../utils/helper';
import { wxAuthenticate } from '../middleware/wxAuth.middleware';
import { prisma } from '../../../lib/prisma';
import { paginated, success, badRequest } from '../../../types/response';

const router: ExpressRouter = Router();

// 所有路由需要微信用户身份
router.use(wxAuthenticate);

// ============ 用户收藏夹 ============

/** 获取当前用户的收藏夹列表 */
router.get('/my-collections', asyncHandler(async (req, res) => {
  const userId = (req as any).userId;
  const list = await prisma.collection.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });
  res.json(success(list));
}));

/** 创建收藏夹 */
router.post('/collections', asyncHandler(async (req, res) => {
  const userId = (req as any).userId;
  const { name, description, isPublic } = req.body;
  if (!name?.trim()) {
    res.status(400).json(badRequest('收藏夹名称不能为空'));
    return;
  }
  const count = await prisma.collection.count({ where: { userId } });
  if (count >= 10) {
    res.status(400).json(badRequest('最多创建10个收藏夹'));
    return;
  }
  const existing = await prisma.collection.findFirst({
    where: { userId, name: name.trim() },
  });
  if (existing) {
    res.status(400).json(badRequest('收藏夹名称已存在'));
    return;
  }
  const collection = await prisma.collection.create({
    data: {
      userId,
      name: name.trim(),
      description: description || '',
      isPublic: isPublic || false,
    },
  });
  res.json(success(collection, '创建成功'));
}));

/** 更新收藏夹 */
router.put('/collections/:id', asyncHandler(async (req, res) => {
  const userId = (req as any).userId;
  const id = parseInt(req.params.id);
  const { name, description, coverImage } = req.body;
  const existing = await prisma.collection.findUnique({ where: { id, userId } });
  if (!existing) {
    res.status(404).json({ code: 404, message: '收藏夹不存在', timestamp: Date.now() });
    return;
  }
  // 默认收藏夹（id=1）不允许改名
  if (existing.id === 1 && name && name !== existing.name) {
    res.status(400).json(badRequest('默认收藏夹不能改名'));
    return;
  }
  const data: any = {};
  if (name !== undefined) data.name = name.trim();
  if (description !== undefined) data.description = description;
  if (coverImage !== undefined) data.coverImage = coverImage;
  const updated = await prisma.collection.update({ where: { id }, data });
  res.json(success(updated, '更新成功'));
}));

/** 删除收藏夹 */
router.delete('/collections/:id', asyncHandler(async (req, res) => {
  const userId = (req as any).userId;
  const id = parseInt(req.params.id);
  const existing = await prisma.collection.findUnique({ where: { id, userId } });
  if (!existing) {
    res.status(404).json({ code: 404, message: '收藏夹不存在', timestamp: Date.now() });
    return;
  }
  if (existing.id === 1) {
    res.status(400).json(badRequest('默认收藏夹不能删除'));
    return;
  }
  if ((existing.itemCount || 0) > 0) {
    res.status(400).json(badRequest('请先移除收藏夹中的菜品'));
    return;
  }
  await prisma.collection.delete({ where: { id } });
  res.json(success(null, '删除成功'));
}));

/** 获取收藏夹详情 */
router.get('/collections/:id', asyncHandler(async (req, res) => {
  const userId = (req as any).userId;
  const id = parseInt(req.params.id);
  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          recipe: {
            select: {
              id: true, title: true, coverImage: true,
              cookingTime: true, difficulty: true, favoriteCount: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!collection || collection.userId !== userId) {
    res.status(404).json({ code: 404, message: '收藏夹不存在', timestamp: Date.now() });
    return;
  }
  res.json(success(collection));
}));

/** 添加收藏 */
router.post('/collections/:id/items', asyncHandler(async (req, res) => {
  const userId = (req as any).userId;
  const collectionId = parseInt(req.params.id);
  const { recipeId } = req.body;
  if (!recipeId) {
    res.status(400).json(badRequest('缺少 recipeId'));
    return;
  }
  const [collection, recipe] = await Promise.all([
    prisma.collection.findUnique({ where: { id: collectionId, userId } }),
    prisma.recipe.findUnique({ where: { id: recipeId } }),
  ]);
  if (!collection) {
    res.status(404).json({ code: 404, message: '收藏夹不存在', timestamp: Date.now() });
    return;
  }
  if (!recipe) {
    res.status(404).json({ code: 404, message: '菜谱不存在', timestamp: Date.now() });
    return;
  }
  await prisma.$transaction([
    prisma.collectionItem.upsert({
      where: { collectionId_recipeId: { collectionId, recipeId } },
      update: {},
      create: { collectionId, recipeId },
    }),
    prisma.collection.update({
      where: { id: collectionId },
      data: { itemCount: { increment: 1 }, updatedAt: new Date() },
    }),
    prisma.recipe.update({
      where: { id: recipeId },
      data: { collectCount: { increment: 1 } },
    }),
  ]);
  res.json(success(null, '已添加'));
}));

/** 移除收藏 */
router.delete('/collections/:id/items/:recipeId', asyncHandler(async (req, res) => {
  const userId = (req as any).userId;
  const collectionId = parseInt(req.params.id);
  const recipeId = parseInt(req.params.recipeId);
  const collection = await prisma.collection.findUnique({ where: { id: collectionId, userId } });
  if (!collection) {
    res.status(404).json({ code: 404, message: '收藏夹不存在', timestamp: Date.now() });
    return;
  }
  const item = await prisma.collectionItem.findUnique({
    where: { collectionId_recipeId: { collectionId, recipeId } },
  });
  if (item) {
    await prisma.$transaction([
      prisma.collectionItem.delete({ where: { collectionId_recipeId: { collectionId, recipeId } } }),
      prisma.collection.update({
        where: { id: collectionId },
        data: { itemCount: { decrement: 1 }, updatedAt: new Date() },
      }),
      prisma.recipe.update({
        where: { id: recipeId },
        data: { collectCount: { decrement: 1 } },
      }),
    ]);
  }
  res.json(success(null, '已移除'));
}));

// ============ 反馈 ============

/** 提交反馈 */
router.post('/feedback', asyncHandler(async (req, res) => {
  const userId = (req as any).userId;
  const { type, content, contact, images } = req.body;
  if (!type || !content) {
    res.status(400).json(badRequest('缺少必填字段'));
    return;
  }
  const feedback = await prisma.feedback.create({
    data: {
      userId,
      type: type.toUpperCase(),
      content,
      contact: contact || '',
      images: images || [],
      status: 'PENDING',
    },
  });
  res.json(success({ feedbackId: feedback.id }, '提交成功'));
}));

/** 获取我的反馈历史 */
router.get('/my-feedback', asyncHandler(async (req, res) => {
  const userId = (req as any).userId;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const [list, total] = await Promise.all([
    prisma.feedback.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        replies: {
          orderBy: { createdAt: 'asc' },
          include: { admin: { select: { nickname: true } } },
        },
      },
    }),
    prisma.feedback.count({ where: { userId } }),
  ]);
  const formatted = list.map(f => ({
    id: f.id,
    feedbackId: f.id,
    type: f.type.toLowerCase(),
    typeLabel: f.type,
    content: f.content,
    contact: f.contact || '',
    images: (f.images as string[]) || [],
    createTime: f.createdAt.getTime(),
    status: f.status.toLowerCase(),
    reply: f.replies.map(r => ({
      adminName: r.admin?.nickname || '管理员',
      content: r.content,
      createTime: r.createdAt.getTime(),
    })),
  }));
  res.json(paginated(formatted, { page, pageSize, total }));
}));

/** 获取单个反馈状态 */
router.get('/feedback/:id', asyncHandler(async (req, res) => {
  const userId = (req as any).userId;
  const id = parseInt(req.params.id);
  const feedback = await prisma.feedback.findFirst({
    where: { id, userId },
    include: {
      replies: {
        orderBy: { createdAt: 'asc' },
        include: { admin: { select: { nickname: true } } },
      },
    },
  });
  if (!feedback) {
    res.status(404).json({ code: 404, message: '反馈不存在', timestamp: Date.now() });
    return;
  }
  res.json(success({
    id: feedback.id,
    feedbackId: feedback.id,
    type: feedback.type.toLowerCase(),
    typeLabel: feedback.type,
    content: feedback.content,
    status: feedback.status.toLowerCase(),
    createTime: feedback.createdAt.getTime(),
    reply: feedback.replies.map(r => ({
      adminName: r.admin?.nickname || '管理员',
      content: r.content,
      createTime: r.createdAt.getTime(),
    })),
  }));
}));

export default router;
