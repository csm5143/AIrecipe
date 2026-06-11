import { Request, Response } from 'express';
import { prisma } from '../../../lib/prisma';
import { badRequest, notFound, paginated, success } from '../../../types/response';
import { createOperationLog, getAdminId, getAdminName } from '../../../utils/adminHelper';

function intValue(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

function dateValue(value: unknown) {
  if (!value) return undefined;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function buildWhere(query: any) {
  const where: any = {};
  const keyword = String(query.keyword || '').trim();
  const recipeKeyword = String(query.recipeKeyword || '').trim();
  const userKeyword = String(query.userKeyword || '').trim();
  const recipeId = intValue(query.recipeId);
  const userId = intValue(query.userId);
  const parentType = String(query.parentType || '').trim();
  const startDate = dateValue(query.startDate);
  const endDate = dateValue(query.endDate);

  if (keyword) where.content = { contains: keyword, mode: 'insensitive' };
  if (recipeId) where.recipeId = recipeId;
  if (userId) where.userId = userId;
  if (parentType === 'root') where.parentId = null;
  if (parentType === 'reply') where.parentId = { not: null };
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }
  if (recipeKeyword) {
    where.recipe = { title: { contains: recipeKeyword, mode: 'insensitive' } };
  }
  if (userKeyword) {
    where.user = {
      OR: [
        { nickname: { contains: userKeyword, mode: 'insensitive' } },
        { phone: { contains: userKeyword } },
      ],
    };
  }
  return where;
}

function mapComment(item: any) {
  return {
    id: item.id,
    recipeId: item.recipeId,
    userId: item.userId,
    parentId: item.parentId,
    content: item.content,
    likeCount: item.likeCount || 0,
    createdAt: item.createdAt?.getTime?.() || null,
    updatedAt: item.updatedAt?.getTime?.() || null,
    replyCount: item._count?.replies || 0,
    user: {
      id: item.user?.id || 0,
      nickname: item.user?.nickname || '',
      avatar: item.user?.avatar || '',
      phone: item.user?.phone || '',
    },
    recipe: {
      id: item.recipe?.id || 0,
      title: item.recipe?.title || '',
      coverImage: item.recipe?.coverImage || '',
      authorName: item.recipe?.authorName || '',
    },
    parent: item.parent ? {
      id: item.parent.id,
      content: item.parent.content,
      user: {
        id: item.parent.user?.id || 0,
        nickname: item.parent.user?.nickname || '',
        avatar: item.parent.user?.avatar || '',
      },
    } : null,
  };
}

export async function listAdminComments(req: Request, res: Response) {
  const page = intValue(req.query.page, 1);
  const pageSize = Math.min(intValue(req.query.pageSize, 20), 100);
  const where = buildWhere(req.query);

  const [list, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { id: true, nickname: true, avatar: true, phone: true } },
        recipe: { select: { id: true, title: true, coverImage: true, authorName: true } },
        parent: {
          include: { user: { select: { id: true, nickname: true, avatar: true } } },
        },
        _count: { select: { replies: true } },
      },
    }),
    prisma.comment.count({ where }),
  ]);

  res.json(paginated(list.map(mapComment), { page, pageSize, total }));
}

export async function getAdminCommentDetail(req: Request, res: Response) {
  const id = intValue(req.params.id);
  const comment = await prisma.comment.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, nickname: true, avatar: true, phone: true } },
      recipe: { select: { id: true, title: true, coverImage: true, authorName: true } },
      parent: { include: { user: { select: { id: true, nickname: true, avatar: true } } } },
      replies: {
        orderBy: { createdAt: 'asc' },
        include: {
          user: { select: { id: true, nickname: true, avatar: true, phone: true } },
          recipe: { select: { id: true, title: true, coverImage: true, authorName: true } },
          _count: { select: { replies: true } },
        },
      },
      _count: { select: { replies: true } },
    },
  });
  if (!comment) {
    res.status(404).json(notFound('Comment not found'));
    return;
  }
  res.json(success({ ...mapComment(comment), replies: comment.replies.map(mapComment) }));
}

export async function createAdminComment(req: Request, res: Response) {
  const recipeId = intValue(req.body.recipeId);
  const userId = intValue(req.body.userId);
  const parentId = intValue(req.body.parentId);
  const content = String(req.body.content || '').trim();
  if (!recipeId || !userId || !content) {
    res.status(400).json(badRequest('recipeId, userId and content are required'));
    return;
  }

  const [recipe, user, parent] = await Promise.all([
    prisma.recipe.findUnique({ where: { id: recipeId }, select: { id: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
    parentId ? prisma.comment.findUnique({ where: { id: parentId }, select: { id: true, recipeId: true, parentId: true } }) : null,
  ]);
  if (!recipe || !user || (parentId && !parent)) {
    res.status(404).json(notFound('Recipe, user or parent comment not found'));
    return;
  }

  const created = await prisma.$transaction(async (tx) => {
    const item = await tx.comment.create({
      data: {
        recipeId,
        userId,
        parentId: parent ? (parent.parentId || parent.id) : null,
        content,
      },
    });
    await tx.recipe.update({ where: { id: recipeId }, data: { commentCount: { increment: 1 } } });
    return item;
  });
  await createOperationLog(getAdminId(req), getAdminName(req), 'create', 'comment', String(created.id), `Created comment ${created.id}`, req.ip || undefined);
  res.json(success(created, 'Created'));
}

export async function updateAdminComment(req: Request, res: Response) {
  const id = intValue(req.params.id);
  const content = String(req.body.content || '').trim();
  if (!content) {
    res.status(400).json(badRequest('Content is required'));
    return;
  }
  const existing = await prisma.comment.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json(notFound('Comment not found'));
    return;
  }
  const updated = await prisma.comment.update({ where: { id }, data: { content } });
  await createOperationLog(getAdminId(req), getAdminName(req), 'update', 'comment', String(id), `Updated comment ${id}`, req.ip || undefined);
  res.json(success(updated, 'Updated'));
}

export async function deleteAdminComment(req: Request, res: Response) {
  const id = intValue(req.params.id);
  const existing = await prisma.comment.findUnique({
    where: { id },
    include: { _count: { select: { replies: true } } },
  });
  if (!existing) {
    res.status(404).json(notFound('Comment not found'));
    return;
  }
  const decrement = 1 + (existing._count?.replies || 0);
  await prisma.$transaction([
    prisma.comment.delete({ where: { id } }),
    prisma.recipe.update({
      where: { id: existing.recipeId },
      data: { commentCount: { decrement } },
    }),
  ]);
  await createOperationLog(getAdminId(req), getAdminName(req), 'delete', 'comment', String(id), `Deleted comment ${id}`, req.ip || undefined);
  res.json(success(null, 'Deleted'));
}

export async function searchCommentRecipes(req: Request, res: Response) {
  const keyword = String(req.query.keyword || '').trim();
  const where: any = { isDeleted: false };
  if (keyword) {
    where.OR = [
      { title: { contains: keyword, mode: 'insensitive' } },
      { authorName: { contains: keyword, mode: 'insensitive' } },
    ];
  }
  const recipes = await prisma.recipe.findMany({
    where,
    take: 20,
    orderBy: [{ commentCount: 'desc' }, { updatedAt: 'desc' }],
    select: { id: true, title: true, coverImage: true, authorName: true, commentCount: true },
  });
  res.json(success(recipes));
}
