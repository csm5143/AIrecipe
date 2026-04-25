
import { Request, Response } from 'express';
import { prisma } from '../../../lib/prisma';
import { paginated, success, notFound, badRequest } from '../../../types/response';

const collectionInclude = {
  items: {
    select: {
      id: true,
      recipeId: true,
      note: true,
      createdAt: true,
    },
  },
  user: {
    select: {
      id: true,
      nickname: true,
      avatar: true,
    },
  },
};

export async function getCollections(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const { keyword, isPublic } = req.query;

  const where: any = {};
  if (keyword) {
    where.name = { contains: String(keyword), mode: 'insensitive' };
  }
  if (isPublic !== undefined) {
    where.isPublic = isPublic === 'true';
  }

  const [total, list] = await Promise.all([
    prisma.collection.count({ where }),
    prisma.collection.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { updatedAt: 'desc' },
      include: {
        user: { select: { id: true, nickname: true, avatar: true } },
        _count: { select: { items: true } },
      },
    }),
  ]);

  const mapped = list.map((c) => ({
    ...c,
    itemCount: c._count.items,
    user: c.user ? { id: c.user.id, nickname: c.user.nickname, avatar: c.user.avatar } : null,
  }));

  res.json(paginated(mapped, { page, pageSize, total }));
}

export async function getCollectionById(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json(badRequest('无效的收藏夹 ID'));
    return;
  }

  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      ...collectionInclude,
      items: {
        include: {
          collection: false,
        },
      },
    },
  });

  if (!collection) {
    res.status(404).json(notFound('收藏夹不存在'));
    return;
  }

  res.json(success(collection));
}

export async function createCollection(req: Request, res: Response) {
  const { name, description, isPublic, userId } = req.body;

  if (!name) {
    res.status(400).json(badRequest('收藏夹名称不能为空'));
    return;
  }
  if (!userId) {
    res.status(400).json(badRequest('用户 ID 不能为空'));
    return;
  }

  const result = await prisma.collection.create({
    data: {
      name,
      description,
      isPublic: isPublic || false,
      userId: parseInt(userId),
    },
    include: collectionInclude,
  });

  res.json(success(result, '创建成功'));
}

export async function updateCollection(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json(badRequest('无效的收藏夹 ID'));
    return;
  }

  const existing = await prisma.collection.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json(notFound('收藏夹不存在'));
    return;
  }

  const { name, description, isPublic } = req.body;
  const result = await prisma.collection.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(isPublic !== undefined && { isPublic }),
    },
    include: collectionInclude,
  });

  res.json(success(result, '更新成功'));
}

export async function deleteCollection(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json(badRequest('无效的收藏夹 ID'));
    return;
  }

  const existing = await prisma.collection.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json(notFound('收藏夹不存在'));
    return;
  }

  await prisma.collection.delete({ where: { id } });
  res.json(success(null, '删除成功'));
}

export async function addCollectionItem(req: Request, res: Response) {
  const collectionId = parseInt(req.params.id);
  const { recipeId, note } = req.body;

  if (isNaN(collectionId)) {
    res.status(400).json(badRequest('无效的收藏夹 ID'));
    return;
  }
  if (!recipeId) {
    res.status(400).json(badRequest('菜谱 ID 不能为空'));
    return;
  }

  const [collection, recipe] = await Promise.all([
    prisma.collection.findUnique({ where: { id: collectionId } }),
    prisma.recipe.findUnique({ where: { id: parseInt(recipeId) } }),
  ]);

  if (!collection) {
    res.status(404).json(notFound('收藏夹不存在'));
    return;
  }
  if (!recipe) {
    res.status(404).json(notFound('菜谱不存在'));
    return;
  }

  await prisma.$transaction([
    prisma.collectionItem.upsert({
      where: { collectionId_recipeId: { collectionId, recipeId: parseInt(recipeId) } },
      update: { note },
      create: { collectionId, recipeId: parseInt(recipeId), note },
    }),
    prisma.collection.update({
      where: { id: collectionId },
      data: { itemCount: { increment: 1 } },
    }),
    prisma.recipe.update({
      where: { id: parseInt(recipeId) },
      data: { collectCount: { increment: 1 } },
    }),
  ]);

  res.json(success(null, '已添加'));
}

export async function removeCollectionItem(req: Request, res: Response) {
  const collectionId = parseInt(req.params.id);
  const recipeId = parseInt(req.params.recipeId);

  if (isNaN(collectionId) || isNaN(recipeId)) {
    res.status(400).json(badRequest('参数无效'));
    return;
  }

  const item = await prisma.collectionItem.findUnique({
    where: { collectionId_recipeId: { collectionId, recipeId } },
  });
  if (!item) {
    res.status(404).json(notFound('收藏项不存在'));
    return;
  }

  await prisma.$transaction([
    prisma.collectionItem.delete({
      where: { collectionId_recipeId: { collectionId, recipeId } },
    }),
    prisma.collection.update({
      where: { id: collectionId },
      data: { itemCount: { decrement: 1 } },
    }),
    prisma.recipe.update({
      where: { id: recipeId },
      data: { collectCount: { decrement: 1 } },
    }),
  ]);

  res.json(success(null, '已移除'));
}
