import { Request, Response } from 'express';
import { paginated } from '../../../types/response';
import { prisma } from '../../../lib/prisma';

export async function getMyRecipes(req: Request, res: Response) {
  const userId = (req as any).userId;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);

  try {
    const where: any = {
      source: 'USER',
      authorId: userId,
    };

    const [data, total] = await Promise.all([
      prisma.recipe.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.recipe.count({ where }),
    ]);

    const formattedData = data.map(formatRecipeResponse);

    res.json(paginated(formattedData, { page, pageSize, total }));
  } catch (error) {
    console.error('[UserRecipe] 获取我的菜谱失败', error);
    res.json(paginated([], { page, pageSize, total: 0 }));
  }
}

export async function getCommunityRecipes(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);

  try {
    const [data, total] = await Promise.all([
      prisma.recipe.findMany({
        where: {
          source: 'USER',
          status: 'PUBLISHED',
        },
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.recipe.count({
        where: {
          source: 'USER',
          status: 'PUBLISHED',
        },
      }),
    ]);

    const formattedData = data.map(formatRecipeResponse);

    res.json(paginated(formattedData, { page, pageSize, total }));
  } catch (error) {
    console.error('[UserRecipe] 获取社区菜谱失败', error);
    res.json(paginated([], { page, pageSize, total: 0 }));
  }
}

export async function getRecipeDetail(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: parseInt(id) },
    });

    if (!recipe) {
      res.json({ success: false, message: '菜谱不存在' });
      return;
    }

    res.json({
      success: true,
      message: '获取成功',
      data: formatRecipeResponse(recipe),
    });
  } catch (error) {
    console.error('[UserRecipe] 获取菜谱详情失败', error);
    res.json({ success: false, message: '获取失败' });
  }
}

export async function submitRecipe(req: Request, res: Response) {
  const userId = (req as any).userId;
  const user = (req as any).user;
  const {
    title,
    coverImage,
    description,
    difficulty,
    cookingTime,
    servings,
    ingredients,
    steps,
    tips,
    tags,
    mealTimes,
    dishTypes,
  } = req.body;

  try {
    const recipe = await prisma.recipe.create({
      data: {
        recipeKey: 'ur_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10),
        source: 'USER',
        authorId: userId,
        authorName: user?.nickname || '美食爱好者',
        authorAvatar: user?.avatar || '',
        title: title.trim(),
        coverImage,
        description: description?.trim() || '',
        difficulty: difficulty === 'easy' ? 'EASY' : difficulty === 'hard' ? 'HARD' : 'MEDIUM',
        cookingTime: parseInt(cookingTime) || 30,
        servings: parseInt(servings) || 2,
        ingredients: ingredients || [],
        steps: steps || [],
        tips: tips || '',
        tags: tags || [],
        mealTimes: mealTimes || [],
        dishTypes: dishTypes || [],
        status: 'PENDING',
      },
    });

    res.json({
      success: true,
      message: '提交成功，等待审核',
      recipeId: recipe.id,
    });
  } catch (error) {
    console.error('[UserRecipe] 提交菜谱失败', error);
    res.status(500).json({ success: false, message: '提交失败' });
  }
}

export async function deleteMyRecipe(req: Request, res: Response) {
  const { id } = req.params;
  const userId = (req as any).userId;

  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: parseInt(id) },
    });

    if (!recipe) {
      res.json({ success: false, message: '菜谱不存在' });
      return;
    }

    if (recipe.authorId !== userId) {
      res.json({ success: false, message: '无权删除' });
      return;
    }

    if (recipe.status === 'PUBLISHED') {
      res.json({ success: false, message: '已发布的菜谱不能删除' });
      return;
    }

    await prisma.recipe.delete({
      where: { id: parseInt(id) },
    });

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('[UserRecipe] 删除菜谱失败', error);
    res.json({ success: false, message: '删除失败' });
  }
}

export async function toggleLike(req: Request, res: Response) {
  const { id } = req.params;
  const userId = (req as any).userId;

  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: parseInt(id) },
    });

    if (!recipe) {
      res.json({ success: false, message: '菜谱不存在' });
      return;
    }

    const existingLike = await prisma.favorite.findUnique({
      where: {
        userId_recipeId: {
          userId,
          recipeId: parseInt(id),
        },
      },
    });

    let liked = false;
    let newLikeCount = recipe.favoriteCount || 0;

    if (existingLike) {
      await prisma.favorite.delete({
        where: { id: existingLike.id },
      });
      newLikeCount = Math.max(0, newLikeCount - 1);
    } else {
      await prisma.favorite.create({
        data: {
          userId,
          recipeId: parseInt(id),
        },
      });
      newLikeCount = newLikeCount + 1;
      liked = true;
    }

    await prisma.recipe.update({
      where: { id: parseInt(id) },
      data: { favoriteCount: newLikeCount },
    });

    res.json({
      success: true,
      message: liked ? '点赞成功' : '取消点赞',
      liked,
      likeCount: newLikeCount,
    });
  } catch (error) {
    console.error('[UserRecipe] 点赞操作失败', error);
    res.json({ success: false, message: '操作失败' });
  }
}

export async function increaseViewCount(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const recipe = await prisma.recipe.update({
      where: { id: parseInt(id) },
      data: { viewCount: { increment: 1 } },
    });

    res.json({
      success: true,
      message: '浏览量增加成功',
      viewCount: recipe.viewCount,
    });
  } catch (error) {
    console.error('[UserRecipe] 增加浏览量失败', error);
    res.json({ success: false, message: '操作失败' });
  }
}

function formatRecipeResponse(item: any) {
  return {
    id: item.id,
    recipeId: item.recipeKey,
    source: item.source,
    authorId: item.authorId,
    authorName: item.authorName || '美食爱好者',
    authorAvatar: item.authorAvatar || '',
    title: item.title,
    coverImage: item.coverImage || '',
    description: item.description || '',
    difficulty: item.difficulty?.toLowerCase() || 'normal',
    cookingTime: item.cookingTime,
    servings: item.servings,
    ingredients: item.ingredients || [],
    steps: item.steps || [],
    tips: item.tips || '',
    tags: item.tags || [],
    mealTimes: item.mealTimes || [],
    dishTypes: item.dishTypes || [],
    cuisine: item.cuisine || '',
    category: item.category || '',
    status: item.status?.toLowerCase() || 'draft',
    rejectReason: item.rejectReason || '',
    viewCount: item.viewCount || 0,
    favoriteCount: item.favoriteCount || 0,
    collectCount: item.collectCount || 0,
    shareCount: item.shareCount || 0,
    commentCount: item.commentCount || 0,
    isFeatured: item.isFeatured || false,
    isHot: item.isHot || false,
    publishedAt: item.publishedAt ? item.publishedAt.getTime() : null,
    createdAt: item.createdAt.getTime(),
    updatedAt: item.updatedAt.getTime(),
  };
}
