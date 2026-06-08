/**
 * 小程序用户端路由 - /api/v1/wx/user/*, /api/v1/wx/feedback, /api/v1/wx/collection
 * 无需 admin 认证，只需 wx 用户认证
 */

import { Router, Router as ExpressRouter } from 'express';
import { asyncHandler } from '../../../utils/helper';
import { wxAuthenticate } from '../middleware/wxAuth.middleware';
import { prisma } from '../../../lib/prisma';
import { hasTable } from '../../../services/databaseCapability.service';
import { paginated, success, badRequest } from '../../../types/response';
import { normalizeCollectionName, canDeleteCollection } from '../utils/collectionRules';
import {
  deleteAiChatMessage,
  editAiChatUserMessage,
  getAiChatSessionMessages,
  getAiChatSessions,
  sendAiChatMessage,
} from '../../../services/aiChatRag.service';
import { createNotification } from '../../../services/notification.service';
import { logUserActivity } from '../../../services/activityLog.service';
import notificationRoutes from '../../notification/routes/notification.routes';

const router: ExpressRouter = Router();

// 所有路由需要微信用户身份
router.use(wxAuthenticate);

function mapRecipeForApp(recipe: any) {
  return {
    id: recipe.id,
    title: recipe.title,
    coverImage: recipe.coverImage || '',
    description: recipe.description || '',
    difficulty: recipe.difficulty?.toLowerCase() || 'normal',
    cookingTime: recipe.cookingTime || 0,
    collectCount: recipe.collectCount || 0,
    likes: recipe.favoriteCount || 0,
    authorName: recipe.authorName || '',
    authorAvatar: recipe.authorAvatar || '',
    updatedAt: recipe.updatedAt?.getTime?.() || Date.now(),
  };
}

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
  const trimmedName = normalizeCollectionName(name);
  const count = await prisma.collection.count({ where: { userId } });
  if (count >= 10) {
    res.status(400).json(badRequest('最多创建10个收藏夹'));
    return;
  }
  const existing = await prisma.collection.findFirst({
    where: { userId, name: trimmedName },
  });
  if (existing) {
    res.status(400).json(badRequest('收藏夹名称已存在'));
    return;
  }
  const collection = await prisma.collection.create({
    data: {
      userId,
      name: trimmedName,
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
  if (name !== undefined) normalizeCollectionName(name);
  const data: any = {};
  if (name !== undefined) data.name = (name as string).trim();
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
  const deleteCheck = canDeleteCollection(existing);
  if (!deleteCheck.ok) {
    res.status(400).json(badRequest(deleteCheck.message));
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
              cookingTime: true, difficulty: true, collectCount: true,
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
  const mapped = {
    ...collection,
    recipes: collection.items.map(item => item.recipe).filter(Boolean),
  };
  res.json(success(mapped));
}));

/** 添加收藏 */
router.post('/collections/:id/items', asyncHandler(async (req, res) => {
  const userId = (req as any).userId;
  const collectionId = parseInt(req.params.id);
  const recipeId = parseInt(req.body.recipeId);
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

  const existingItem = await prisma.collectionItem.findUnique({
    where: { collectionId_recipeId: { collectionId, recipeId } },
  });

  if (existingItem) {
    res.json(success(null, '已添加'));
    return;
  }

  await prisma.$transaction([
    prisma.collectionItem.create({ data: { collectionId, recipeId } }),
    prisma.collection.update({ where: { id: collectionId }, data: { itemCount: { increment: 1 }, updatedAt: new Date() } }),
    prisma.recipe.update({ where: { id: recipeId }, data: { collectCount: { increment: 1 } } }),
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
// ============ User profile ============

router.get('/users/:id', asyncHandler(async (req, res) => {
  const currentUserId = (req as any).userId;
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json(badRequest('Invalid user id'));
    return;
  }

  const user = await prisma.user.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      nickname: true,
      avatar: true,
      bio: true,
      gender: true,
      collections: {
        where: { isPublic: true },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          coverImage: true,
          itemCount: true,
          updatedAt: true,
        },
      },
      _count: {
        select: {
          followers: true,
          following: true,
        },
      },
    },
  });

  if (!user) {
    res.status(404).json({ code: 404, message: 'User not found', timestamp: Date.now() });
    return;
  }

  const [works, collectionCount, isFollowing] = await Promise.all([
    prisma.recipe.count({
      where: { authorId: id, isDeleted: false, status: 'PUBLISHED' as any },
    }),
    prisma.collectionItem.count({
      where: { collection: { userId: id, isPublic: true } },
    }),
    currentUserId === id
      ? Promise.resolve(false)
      : prisma.follow
          .findUnique({
            where: { followerId_followingId: { followerId: currentUserId, followingId: id } },
          })
          .then(Boolean),
  ]);

  res.json(success({
    id: user.id,
    nickname: user.nickname || '',
    avatar: user.avatar || '',
    bio: user.bio || '',
    gender: user.gender,
    followers: user._count.followers,
    following: user._count.following,
    works,
    collections: collectionCount,
    isFollowing,
    publicCollections: user.collections.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description || '',
      coverImage: c.coverImage || '',
      itemCount: c.itemCount,
      updatedAt: c.updatedAt.getTime(),
    })),
  }));
}));

router.post('/users/:id/follow', asyncHandler(async (req, res) => {
  const followerId = (req as any).userId;
  const followingId = parseInt(req.params.id);
  if (isNaN(followingId) || followerId === followingId) {
    res.status(400).json(badRequest('Invalid user id'));
    return;
  }

  const existingFollow = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });

  if (!existingFollow) {
    await prisma.follow.create({ data: { followerId, followingId } });

    // 通知被关注者
    const follower = await prisma.user.findUnique({
      where: { id: followerId },
      select: { nickname: true },
    });
    createNotification({
      userId: followingId,
      type: 'NEW_FOLLOWER',
      title: '你有新的关注者',
      content: `${follower?.nickname || '有用户'} 关注了你`,
      data: { followerId, followerName: follower?.nickname || '' },
    });
  }
  res.json(success(null, 'Followed'));
}));

router.delete('/users/:id/follow', asyncHandler(async (req, res) => {
  const followerId = (req as any).userId;
  const followingId = parseInt(req.params.id);
  if (!isNaN(followingId)) {
    await prisma.follow.deleteMany({ where: { followerId, followingId } });
  }
  res.json(success(null, 'Unfollowed'));
}));

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

/** 批量获取用户所有收藏夹中的菜谱 ID（避免 N+1 查询） */
router.get('/collected-recipe-ids', asyncHandler(async (req, res) => {
  const userId = (req as any).userId;
  const items = await prisma.collectionItem.findMany({
    where: { collection: { userId } },
    select: { recipeId: true },
  });
  res.json(success(items.map(i => i.recipeId)));
}));

/** 获取当前用户点赞过的菜谱 */
router.get('/favorites', asyncHandler(async (req, res) => {
  const userId = (req as any).userId;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);

  const [favorites, total] = await Promise.all([
    prisma.favorite.findMany({
      where: { userId },
      include: { recipe: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.favorite.count({ where: { userId } }),
  ]);

  const data = favorites
    .filter(item => item.recipe && !item.recipe.isDeleted)
    .map(item => ({
      favoriteId: item.id,
      likedAt: item.createdAt.getTime(),
      ...mapRecipeForApp(item.recipe),
    }));

  res.json(paginated(data, { page, pageSize, total }));
}));

// ============ 小菜篮 ============

/** 获取用户的购物清单列表 */
router.get('/shopping-lists', asyncHandler(async (req, res) => {
  const userId = (req as any).userId;
  const lists = await prisma.shoppingList.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: { items: { orderBy: { createdAt: 'asc' } } },
  });
  res.json(success(lists));
}));

/** 创建/更新购物清单（同一菜谱同名清单 => upsert） */
router.post('/shopping-lists', asyncHandler(async (req, res) => {
  const userId = (req as any).userId;
  const { name, items } = req.body;
  const recipeId = req.body.recipeId ? parseInt(req.body.recipeId) : undefined;
  if (!name || !items || !Array.isArray(items)) {
    res.status(400).json(badRequest('缺少必填字段'));
    return;
  }

  // 查找是否已有同名清单
  let list = await prisma.shoppingList.findFirst({
    where: { userId, name },
  });

  if (list) {
    // 更新已有清单
    list = await prisma.shoppingList.update({
      where: { id: list.id },
      data: {
        recipeId: recipeId || null,
        updatedAt: new Date(),
        items: {
          deleteMany: {},
          create: items.map((i: any) => ({
            name: i.name || '',
            amount: i.amount || '',
            unit: i.unit || '',
            category: i.category || '',
            isChecked: false,
          })),
        },
      },
      include: { items: true },
    });
  } else {
    // 新建清单
    list = await prisma.shoppingList.create({
      data: {
        userId,
        name,
        recipeId: recipeId || null,
        items: {
          create: items.map((i: any) => ({
            name: i.name || '',
            amount: i.amount || '',
            unit: i.unit || '',
            category: i.category || '',
            isChecked: false,
          })),
        },
      },
      include: { items: true },
    });
  }
  res.json(success(list, '保存成功'));
}));

/** 删除购物清单 */
router.delete('/shopping-lists/:id', asyncHandler(async (req, res) => {
  const userId = (req as any).userId;
  const id = parseInt(req.params.id);
  const list = await prisma.shoppingList.findFirst({ where: { id, userId } });
  if (!list) {
    res.status(404).json({ code: 404, message: '清单不存在', timestamp: Date.now() });
    return;
  }
  await prisma.shoppingList.delete({ where: { id } });
  res.json(success(null, '已删除'));
}));

router.get('/scheduled-tasks', asyncHandler(async (req, res) => {
  const userId = (req as any).userId;
  if (!(await hasTable('scheduled_tasks'))) {
    res.json(success([]));
    return;
  }

  const tasks = await (prisma as any).scheduledTask.findMany({
    where: { userId },
    orderBy: [{ fired: 'asc' }, { triggerAt: 'asc' }],
    take: 50,
  });
  res.json(success(tasks.map((task: any) => ({
    id: task.id,
    type: task.type,
    title: task.title,
    body: task.body,
    data: task.data || null,
    triggerAt: task.triggerAt.getTime(),
    fired: task.fired,
    firedAt: task.firedAt ? task.firedAt.getTime() : null,
    createdAt: task.createdAt.getTime(),
  }))));
}));

// ============ 浏览历史 ============

/** 记录浏览历史 */
// ============ AI chat ============

router.post('/ai-chat', asyncHandler(async (req, res) => {
  const userId = (req as any).userId;
  const { text, sessionId, imageUrls } = req.body as { text?: string; sessionId?: number | string; imageUrls?: string[] };
  const promptText = String(text || '').trim();
  const normalizedImageUrls = Array.isArray(imageUrls)
    ? imageUrls.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 6)
    : [];
  if (!promptText && normalizedImageUrls.length === 0) {
    res.status(400).json(badRequest('Missing chat message'));
    return;
  }

  try {
    const result = await sendAiChatMessage({
      userId,
      text: promptText,
      imageUrls: normalizedImageUrls,
      sessionId: sessionId ? Number(sessionId) : undefined,
    });
    logUserActivity({
      userId,
      action: 'ai_chat',
      targetId: result.sessionId ? String(result.sessionId) : undefined,
      detail: `AI 对话：${promptText.slice(0, 50)}${promptText.length > 50 ? '...' : ''}${normalizedImageUrls.length ? `，图片 ${normalizedImageUrls.length} 张` : ''}`,
    });
    res.json(success(result));
  } catch (err: any) {
    console.error('[WX AI Chat] Error:', err);
    res.status(500).json(badRequest(`AI chat failed: ${err.message}`));
  }
}));

router.get('/ai-chat/sessions', asyncHandler(async (req, res) => {
  const userId = (req as any).userId;
  const sessions = await getAiChatSessions(userId);
  res.json(success(sessions));
}));

router.get('/ai-chat/sessions/:id/messages', asyncHandler(async (req, res) => {
  const userId = (req as any).userId;
  const sessionId = parseInt(req.params.id);
  const messages = await getAiChatSessionMessages(userId, sessionId);
  if (!messages) {
    res.status(404).json({ code: 404, message: 'AI chat session not found', timestamp: Date.now() });
    return;
  }
  res.json(success(messages));
}));

router.delete('/ai-chat/messages/:id', asyncHandler(async (req, res) => {
  const userId = (req as any).userId;
  const messageId = parseInt(req.params.id);
  const deleted = await deleteAiChatMessage(userId, messageId);
  if (!deleted) {
    res.status(404).json({ code: 404, message: 'AI chat message not found', timestamp: Date.now() });
    return;
  }
  res.json(success(null, '消息已删除'));
}));

router.put('/ai-chat/messages/:id', asyncHandler(async (req, res) => {
  const userId = (req as any).userId;
  const messageId = parseInt(req.params.id);
  const text = String(req.body?.text || '').trim();
  if (!text) {
    res.status(400).json(badRequest('消息内容不能为空'));
    return;
  }

  const result = await editAiChatUserMessage({ userId, messageId, text });
  if (!result) {
    res.status(404).json({ code: 404, message: 'AI chat user message not found', timestamp: Date.now() });
    return;
  }
  logUserActivity({
    userId,
    action: 'ai_chat_edit',
    targetId: result.sessionId ? String(result.sessionId) : undefined,
    detail: `编辑 AI 对话：${text.slice(0, 50)}${text.length > 50 ? '...' : ''}`,
  });
  res.json(success(result));
}));

router.get('/browse-history', asyncHandler(async (req, res) => {
  const userId = (req as any).userId;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);

  const [list, total] = await Promise.all([
    prisma.browseHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        recipe: {
          select: {
            id: true,
            title: true,
            coverImage: true,
            description: true,
            difficulty: true,
            cookingTime: true,
            collectCount: true,
            authorName: true,
            authorAvatar: true,
          },
        },
      },
    }),
    prisma.browseHistory.count({ where: { userId } }),
  ]);

  const data = list
    .filter(item => item.recipe)
    .map(item => ({
      id: item.id,
      recipeId: item.recipeId,
      source: item.source || '',
      viewedAt: item.createdAt.getTime(),
      recipe: {
        id: item.recipe.id,
        title: item.recipe.title,
        coverImage: item.recipe.coverImage || '',
        description: item.recipe.description || '',
        difficulty: item.recipe.difficulty?.toLowerCase() || 'normal',
        cookingTime: item.recipe.cookingTime,
        collectCount: item.recipe.collectCount || 0,
        authorName: item.recipe.authorName || '',
        authorAvatar: item.recipe.authorAvatar || '',
      },
    }));

  res.json(paginated(data, { page, pageSize, total }));
}));

router.post('/browse-history', asyncHandler(async (req, res) => {
  const userId = (req as any).userId;
  const { recipeId } = req.body;
  if (!recipeId) {
    res.status(400).json(badRequest('缺少 recipeId'));
    return;
  }
  await prisma.browseHistory.create({
    data: {
      userId,
      recipeId: parseInt(recipeId),
      source: req.body.source || 'detail',
    },
  });
  res.json(success(null, '已记录'));
}));

router.delete('/browse-history', asyncHandler(async (req, res) => {
  const userId = (req as any).userId;
  await prisma.browseHistory.deleteMany({ where: { userId } });
  res.json(success(null, '浏览历史已清空'));
}));

// ============ 通知 ============
router.use('/notifications', notificationRoutes);

export default router;
