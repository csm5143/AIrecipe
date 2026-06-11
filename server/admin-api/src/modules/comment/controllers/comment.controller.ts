import { Request, Response } from 'express';
import { NotificationType } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import { badRequest, forbidden, notFound, paginated, success } from '../../../types/response';
import { hasTable } from '../../../services/databaseCapability.service';
import { createNotification } from '../../../services/notification.service';

const MAX_CONTENT_LENGTH = 1000;
const REPLY_PREVIEW_COUNT = 3;

function intParam(value: unknown): number {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : 0;
}

function pageParams(req: Request) {
  const page = Math.max(1, intParam(req.query.page) || 1);
  const pageSize = Math.min(50, Math.max(1, intParam(req.query.pageSize) || 20));
  return { page, pageSize };
}

function cleanContent(value: unknown): string {
  return (value ?? '').toString().trim();
}

function userPayload(user?: { id: number; nickname: string | null; avatar: string | null }) {
  return {
    id: user?.id ?? 0,
    nickname: user?.nickname || '用户',
    avatar: user?.avatar || '',
  };
}

async function likedSet(commentIds: number[], userId: number) {
  if (!commentIds.length) return new Set<number>();
  const likes = await prisma.commentLike.findMany({
    where: { userId, commentId: { in: commentIds } },
    select: { commentId: true },
  });
  return new Set(likes.map((item) => item.commentId));
}

function mapReply(comment: any, likedIds: Set<number>) {
  return {
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt?.getTime?.() ?? Date.now(),
    user: userPayload(comment.user),
    likeCount: comment.likeCount || 0,
    isLiked: likedIds.has(comment.id),
  };
}

function mapComment(comment: any, likedIds: Set<number>) {
  const replies = (comment.replies || []).map((reply: any) => mapReply(reply, likedIds));
  return {
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt?.getTime?.() ?? Date.now(),
    user: userPayload(comment.user),
    likeCount: comment.likeCount || 0,
    isLiked: likedIds.has(comment.id),
    replies,
    replyCount: comment._count?.replies || 0,
  };
}

async function ensureRecipe(recipeId: number) {
  if (!recipeId) return null;
  return prisma.recipe.findFirst({
    where: { id: recipeId, isDeleted: false },
    select: { id: true, title: true, authorId: true },
  });
}

async function ensureCommentTables(res: Response) {
  const [comments, likes] = await Promise.all([
    hasTable('comments'),
    hasTable('comment_likes'),
  ]);
  if (comments && likes) return true;
  res.status(503).json(badRequest('评论功能尚未初始化，请先执行数据库迁移'));
  return false;
}

export async function getRecipeComments(req: Request, res: Response) {
  const userId = req.userId!;
  const recipeId = intParam(req.params.id);
  const recipe = await ensureRecipe(recipeId);
  if (!recipe) {
    res.status(404).json(notFound('Recipe not found'));
    return;
  }
  if (!(await ensureCommentTables(res))) return;

  const { page, pageSize } = pageParams(req);
  const where = { recipeId, parentId: null };
  const [total, comments] = await Promise.all([
    prisma.comment.count({ where }),
    prisma.comment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { id: true, nickname: true, avatar: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          take: REPLY_PREVIEW_COUNT,
          include: { user: { select: { id: true, nickname: true, avatar: true } } },
        },
        _count: { select: { replies: true } },
      },
    }),
  ]);

  const ids = comments.flatMap((item) => [item.id, ...item.replies.map((reply) => reply.id)]);
  const likes = await likedSet(ids, userId);
  res.json(paginated(comments.map((item) => mapComment(item, likes)), { page, pageSize, total }));
}

export async function getCommentReplies(req: Request, res: Response) {
  const userId = req.userId!;
  const commentId = intParam(req.params.id);
  if (!(await ensureCommentTables(res))) return;
  const parent = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, parentId: true },
  });
  if (!parent) {
    res.status(404).json(notFound('Comment not found'));
    return;
  }

  const rootId = parent.parentId ?? parent.id;
  const { page, pageSize } = pageParams(req);
  const where = { parentId: rootId };
  const [total, replies] = await Promise.all([
    prisma.comment.count({ where }),
    prisma.comment.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { user: { select: { id: true, nickname: true, avatar: true } } },
    }),
  ]);

  const likes = await likedSet(replies.map((item) => item.id), userId);
  res.json(paginated(replies.map((item) => mapReply(item, likes)), { page, pageSize, total }));
}

export async function createRecipeComment(req: Request, res: Response) {
  const userId = req.userId!;
  const recipeId = intParam(req.params.id);
  const content = cleanContent(req.body.content);
  if (!content) {
    res.status(400).json(badRequest('Content is required'));
    return;
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    res.status(400).json(badRequest('Content is too long'));
    return;
  }

  const recipe = await ensureRecipe(recipeId);
  if (!recipe) {
    res.status(404).json(notFound('Recipe not found'));
    return;
  }
  if (!(await ensureCommentTables(res))) return;

  const comment = await prisma.$transaction(async (tx) => {
    const created = await tx.comment.create({
      data: { recipeId, userId, content },
      include: { user: { select: { id: true, nickname: true, avatar: true } } },
    });
    await tx.recipe.update({
      where: { id: recipeId },
      data: { commentCount: { increment: 1 } },
    });
    return created;
  });

  if (recipe.authorId && recipe.authorId !== userId) {
    createNotification({
      userId: recipe.authorId,
      type: NotificationType.COMMENT,
      title: 'New comment',
      content: `${comment.user.nickname || 'User'} commented on ${recipe.title}`,
      data: { recipeId, commentId: comment.id },
    });
  }

  res.json(success(mapComment({ ...comment, replies: [], _count: { replies: 0 } }, new Set()), 'Created'));
}

export async function replyComment(req: Request, res: Response) {
  const userId = req.userId!;
  const parentId = intParam(req.params.id);
  const content = cleanContent(req.body.content);
  if (!content) {
    res.status(400).json(badRequest('Content is required'));
    return;
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    res.status(400).json(badRequest('Content is too long'));
    return;
  }
  if (!(await ensureCommentTables(res))) return;

  const parent = await prisma.comment.findUnique({
    where: { id: parentId },
    include: {
      user: { select: { id: true, nickname: true, avatar: true } },
      recipe: { select: { id: true, title: true, authorId: true } },
    },
  });
  if (!parent) {
    res.status(404).json(notFound('Comment not found'));
    return;
  }

  const reply = await prisma.$transaction(async (tx) => {
    const created = await tx.comment.create({
      data: {
        recipeId: parent.recipeId,
        userId,
        parentId: parent.parentId ?? parent.id,
        content,
      },
      include: { user: { select: { id: true, nickname: true, avatar: true } } },
    });
    await tx.recipe.update({
      where: { id: parent.recipeId },
      data: { commentCount: { increment: 1 } },
    });
    return created;
  });

  const notifyUserId = parent.userId !== userId ? parent.userId : parent.recipe.authorId;
  if (notifyUserId && notifyUserId !== userId) {
    createNotification({
      userId: notifyUserId,
      type: NotificationType.COMMENT,
      title: 'New reply',
      content: `${reply.user.nickname || 'User'} replied to your comment`,
      data: { recipeId: parent.recipeId, commentId: parent.id, replyId: reply.id },
    });
  }

  res.json(success(mapReply(reply, new Set()), 'Created'));
}

export async function deleteComment(req: Request, res: Response) {
  const userId = req.userId!;
  const id = intParam(req.params.id);
  if (!(await ensureCommentTables(res))) return;
  const comment = await prisma.comment.findUnique({
    where: { id },
    include: { _count: { select: { replies: true } } },
  });
  if (!comment) {
    res.status(404).json(notFound('Comment not found'));
    return;
  }
  if (comment.userId !== userId) {
    res.status(403).json(forbidden('Cannot delete this comment'));
    return;
  }

  const decrement = 1 + comment._count.replies;
  await prisma.$transaction([
    prisma.comment.delete({ where: { id } }),
    prisma.recipe.update({
      where: { id: comment.recipeId },
      data: { commentCount: { decrement } },
    }),
  ]);

  res.json(success(null, 'Deleted'));
}

export async function likeComment(req: Request, res: Response) {
  const userId = req.userId!;
  const commentId = intParam(req.params.id);
  if (!(await ensureCommentTables(res))) return;
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) {
    res.status(404).json(notFound('Comment not found'));
    return;
  }

  const existing = await prisma.commentLike.findUnique({
    where: { commentId_userId: { commentId, userId } },
  });

  const result = await prisma.$transaction(async (tx) => {
    if (existing) {
      await tx.commentLike.delete({ where: { commentId_userId: { commentId, userId } } });
      const updated = await tx.comment.update({
        where: { id: commentId },
        data: { likeCount: { decrement: 1 } },
      });
      return { liked: false, likeCount: Math.max(0, updated.likeCount) };
    }

    await tx.commentLike.create({ data: { commentId, userId } });
    const updated = await tx.comment.update({
      where: { id: commentId },
      data: { likeCount: { increment: 1 } },
    });
    return { liked: true, likeCount: updated.likeCount };
  });

  res.json(success(result));
}
