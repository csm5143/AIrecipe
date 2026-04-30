import { Request, Response } from 'express';
import { prisma } from '../../../lib/prisma';
import { success, paginated, notFound, badRequest } from '../../../types/response';
import { wxAuthenticate } from '../../wx/middleware/wxAuth.middleware';

export async function getUserFavorites(req: Request, res: Response) {
  const userId = (req as any).userId;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);

  try {
    const [total, favorites] = await Promise.all([
      prisma.favorite.count({ where: { userId } }),
      prisma.favorite.findMany({
        where: { userId },
        include: {
          recipe: {
            select: {
              id: true,
              title: true,
              coverImage: true,
              description: true,
              difficulty: true,
              cookingTime: true,
              calories: true,
              tags: true,
              category: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const recipes = favorites
      .filter(f => f.recipe)
      .map(f => ({
        id: f.recipe.id,
        name: f.recipe.title,
        coverImage: f.recipe.coverImage,
        description: f.recipe.description,
        difficulty: f.recipe.difficulty?.toLowerCase() || 'normal',
        timeCost: f.recipe.cookingTime,
        calories: f.recipe.calories,
        category: f.recipe.category,
        tags: f.recipe.tags || [],
        favoriteId: f.id,
        favoritedAt: f.createdAt,
      }));

    res.json(paginated(recipes, { page, pageSize, total }));
  } catch (error) {
    console.error('[Favorite] 获取收藏列表失败:', error);
    res.status(500).json(badRequest('查询失败'));
  }
}

export async function addFavorite(req: Request, res: Response) {
  const userId = (req as any).userId;
  const { recipeId } = req.body;

  if (!recipeId) {
    res.status(400).json(badRequest('请提供食谱 ID'));
    return;
  }

  const recipeIdInt = parseInt(recipeId);
  if (isNaN(recipeIdInt)) {
    res.status(400).json(badRequest('无效的食谱 ID'));
    return;
  }

  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeIdInt, isDeleted: false },
    });

    if (!recipe) {
      res.status(404).json(notFound('食谱不存在'));
      return;
    }

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_recipeId: { userId, recipeId: recipeIdInt },
      },
    });

    if (existing) {
      res.json(success({ favorited: true }, '已收藏'));
      return;
    }

    await prisma.$transaction([
      prisma.favorite.create({
        data: { userId, recipeId: recipeIdInt },
      }),
      prisma.recipe.update({
        where: { id: recipeIdInt },
        data: { collectCount: { increment: 1 } },
      }),
    ]);

    res.json(success({ favorited: true }, '收藏成功'));
  } catch (error) {
    console.error('[Favorite] 添加收藏失败:', error);
    res.status(500).json(badRequest('收藏失败'));
  }
}

export async function removeFavorite(req: Request, res: Response) {
  const userId = (req as any).userId;
  const recipeId = parseInt(req.params.recipeId);

  if (isNaN(recipeId)) {
    res.status(400).json(badRequest('无效的食谱 ID'));
    return;
  }

  try {
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_recipeId: { userId, recipeId },
      },
    });

    if (!existing) {
      res.json(success({ favorited: false }, '未收藏'));
      return;
    }

    await prisma.$transaction([
      prisma.favorite.delete({
        where: { id: existing.id },
      }),
      prisma.recipe.update({
        where: { id: recipeId },
        data: { collectCount: { decrement: 1 } },
      }),
    ]);

    res.json(success({ favorited: false }, '取消收藏成功'));
  } catch (error) {
    console.error('[Favorite] 取消收藏失败:', error);
    res.status(500).json(badRequest('操作失败'));
  }
}

export async function checkFavorite(req: Request, res: Response) {
  const userId = (req as any).userId;
  const { recipeIds } = req.query;

  if (!recipeIds) {
    res.json(success({}));
    return;
  }

  const idList = (recipeIds as string).split(',').map(id => parseInt(id)).filter(id => !isNaN(id));

  if (idList.length === 0) {
    res.json(success({}));
    return;
  }

  try {
    const favorites = await prisma.favorite.findMany({
      where: {
        userId,
        recipeId: { in: idList },
      },
      select: { recipeId: true },
    });

    const favoritedMap: Record<number, boolean> = {};
    idList.forEach(id => {
      favoritedMap[id] = favorites.some(f => f.recipeId === id);
    });

    res.json(success(favoritedMap));
  } catch (error) {
    console.error('[Favorite] 检查收藏状态失败:', error);
    res.status(500).json(badRequest('查询失败'));
  }
}

export async function getUserCollections(req: Request, res: Response) {
  const userId = (req as any).userId;

  try {
    const collections = await prisma.collection.findMany({
      where: { userId },
      include: {
        _count: {
          select: { items: true },
        },
        items: {
          take: 4,
          orderBy: { createdAt: 'desc' },
          select: {
            recipeId: true,
            recipe: {
              select: { coverImage: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = collections.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      coverImage: c.coverImage,
      coverImages: c.items
        .filter(i => i.recipe?.coverImage)
        .map(i => i.recipe!.coverImage)
        .slice(0, 4),
      itemCount: c._count.items,
      createdAt: c.createdAt,
    }));

    res.json(success(result));
  } catch (error) {
    console.error('[Collection] 获取收藏夹列表失败:', error);
    res.status(500).json(badRequest('查询失败'));
  }
}

export async function createCollection(req: Request, res: Response) {
  const userId = (req as any).userId;
  const { name, description } = req.body;

  if (!name) {
    res.status(400).json(badRequest('请输入收藏夹名称'));
    return;
  }

  try {
    const collection = await prisma.collection.create({
      data: {
        userId,
        name,
        description,
      },
    });

    res.json(success(collection, '创建成功'));
  } catch (error) {
    console.error('[Collection] 创建收藏夹失败:', error);
    res.status(500).json(badRequest('创建失败'));
  }
}

export async function addToCollection(req: Request, res: Response) {
  const userId = (req as any).userId;
  const { collectionId, recipeId } = req.body;

  if (!collectionId || !recipeId) {
    res.status(400).json(badRequest('请提供收藏夹 ID 和食谱 ID'));
    return;
  }

  const recipeIdInt = parseInt(recipeId);
  const collectionIdInt = parseInt(collectionId);

  try {
    const collection = await prisma.collection.findUnique({
      where: { id: collectionIdInt, userId },
    });

    if (!collection) {
      res.status(404).json(notFound('收藏夹不存在'));
      return;
    }

    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeIdInt, isDeleted: false },
    });

    if (!recipe) {
      res.status(404).json(notFound('食谱不存在'));
      return;
    }

    await prisma.collectionItem.upsert({
      where: {
        collectionId_recipeId: { collectionId: collectionIdInt, recipeId: recipeIdInt },
      },
      update: {},
      create: {
        collectionId: collectionIdInt,
        recipeId: recipeIdInt,
      },
    });

    await prisma.collection.update({
      where: { id: collectionIdInt },
      data: { itemCount: { increment: 1 } },
    });

    res.json(success({ added: true }, '添加成功'));
  } catch (error) {
    console.error('[Collection] 添加到收藏夹失败:', error);
    res.status(500).json(badRequest('操作失败'));
  }
}

export async function getCollectionDetail(req: Request, res: Response) {
  const userId = (req as any).userId;
  const collectionId = parseInt(req.params.id);

  if (isNaN(collectionId)) {
    res.status(400).json(badRequest('无效的收藏夹 ID'));
    return;
  }

  try {
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId, userId },
      include: {
        items: {
          orderBy: { createdAt: 'desc' },
          include: {
            recipe: {
              select: {
                id: true,
                title: true,
                coverImage: true,
                description: true,
                difficulty: true,
                cookingTime: true,
                calories: true,
                tags: true,
              },
            },
          },
        },
      },
    });

    if (!collection) {
      res.status(404).json(notFound('收藏夹不存在'));
      return;
    }

    const recipes = collection.items
      .filter(item => item.recipe)
      .map(item => ({
        id: item.recipe.id,
        name: item.recipe.title,
        coverImage: item.recipe.coverImage,
        description: item.recipe.description,
        difficulty: item.recipe.difficulty?.toLowerCase() || 'normal',
        timeCost: item.recipe.cookingTime,
        calories: item.recipe.calories,
        tags: item.recipe.tags || [],
        addedAt: item.createdAt,
      }));

    res.json(success({
      id: collection.id,
      name: collection.name,
      description: collection.description,
      recipes,
    }));
  } catch (error) {
    console.error('[Collection] 获取收藏夹详情失败:', error);
    res.status(500).json(badRequest('查询失败'));
  }
}
