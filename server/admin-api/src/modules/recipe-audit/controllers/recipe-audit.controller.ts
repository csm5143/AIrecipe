import { Request, Response } from 'express';
import { paginated, success } from '../../../types/response';
import { prisma } from '../../../lib/prisma';

export async function getPendingRecipes(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);

  try {
    const where: any = {
      source: 'USER',
      status: 'PENDING',
    };

    if (req.query.keyword) {
      where.OR = [
        { title: { contains: req.query.keyword as string, mode: 'insensitive' } },
        { authorName: { contains: req.query.keyword as string, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.recipe.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.recipe.count({ where }),
    ]);

    const formattedData = data.map(formatRecipeResponse);

    res.json(paginated(formattedData, { page, pageSize, total }));
  } catch (error) {
    console.error('[RecipeAudit] 获取待审核列表失败', error);
    res.json(paginated([], { page, pageSize, total: 0 }));
  }
}

export async function getProcessedRecipes(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);
  const status = req.query.status as string;

  try {
    const where: any = {
      source: 'USER',
      status: status === 'approved' ? 'PUBLISHED' : 'REJECTED',
    };

    if (req.query.keyword) {
      where.OR = [
        { title: { contains: req.query.keyword as string, mode: 'insensitive' } },
        { authorName: { contains: req.query.keyword as string, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.recipe.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.recipe.count({ where }),
    ]);

    const formattedData = data.map(formatRecipeResponse);

    res.json(paginated(formattedData, { page, pageSize, total }));
  } catch (error) {
    console.error('[RecipeAudit] 获取已审核列表失败', error);
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
      res.status(404).json({ code: 404, message: '菜谱不存在' });
      return;
    }

    res.json(success(formatRecipeResponse(recipe)));
  } catch (error) {
    console.error('[RecipeAudit] 获取菜谱详情失败', error);
    res.status(500).json({ code: 500, message: '获取详情失败' });
  }
}

export async function auditRecipe(req: Request, res: Response) {
  const { id } = req.params;
  const { action, reason } = req.body;

  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: parseInt(id) },
    });

    if (!recipe) {
      res.status(404).json({ code: 404, message: '菜谱不存在' });
      return;
    }

    if (recipe.status !== 'PENDING') {
      res.status(400).json({ code: 400, message: '该菜谱已审核过，请勿重复操作' });
      return;
    }

    if (action === 'reject' && !reason?.trim()) {
      res.status(400).json({ code: 400, message: '请填写拒绝原因' });
      return;
    }

    const newStatus = action === 'approve' ? 'PUBLISHED' : 'REJECTED';
    const updateData: any = {
      status: newStatus,
      rejectReason: action === 'reject' ? reason : null,
      reviewedAt: new Date(),
    };

    if (action === 'approve') {
      updateData.publishedAt = new Date();
    }

    await prisma.recipe.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json(success(null, action === 'approve' ? '审核通过' : '已拒绝'));
  } catch (error) {
    console.error('[RecipeAudit] 审核操作失败', error);
    res.status(500).json({ code: 500, message: '操作失败' });
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
    reviewedAt: item.reviewedAt ? item.reviewedAt.getTime() : null,
    publishedAt: item.publishedAt ? item.publishedAt.getTime() : null,
    createdAt: item.createdAt.getTime(),
    updatedAt: item.updatedAt.getTime(),
  };
}
