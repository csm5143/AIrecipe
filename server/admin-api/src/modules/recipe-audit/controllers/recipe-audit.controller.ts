import { Request, Response } from 'express';
import { paginated, success } from '../../../types/response';
import { prisma } from '../../../lib/prisma';
import { createNotification } from '../../../services/notification.service';
import { getAdminId, getAdminName } from '../../../utils/adminHelper';

function buildAuditWhere(query: any): any {
  const where: any = { source: 'USER' };
  const status = query.status as string;

  if (status === 'pending') {
    where.status = 'PENDING';
  } else if (status === 'approved') {
    where.status = 'PUBLISHED';
  } else if (status === 'rejected') {
    where.status = 'REJECTED';
  }
  // status 为空时不过滤，返回全部状态

  if (query.keyword) {
    where.OR = [
      { title: { contains: query.keyword as string, mode: 'insensitive' } },
      { authorName: { contains: query.keyword as string, mode: 'insensitive' } },
    ];
  }
  return where;
}

export async function getPendingRecipes(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);

  try {
    const where = buildAuditWhere({ ...req.query, status: 'pending' });
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

  try {
    const where = buildAuditWhere(req.query);
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
    console.error('[RecipeAudit] 获取列表失败', error);
    res.json(paginated([], { page, pageSize, total: 0 }));
  }
}

export async function getRecipeDetail(req: Request, res: Response) {
  const { id } = req.params;
  const numericId = parseInt(id);

  try {
    // 支持数字 ID 和 recipeKey 字符串两种查找方式
    const recipe = isNaN(numericId)
      ? await prisma.recipe.findUnique({ where: { recipeKey: id } })
      : await prisma.recipe.findUnique({ where: { id: numericId } });

    if (!recipe) {
      res.status(404).json({ code: 404, message: '菜谱不存在' });
      return;
    }

    try {
      res.json(success(formatRecipeResponse(recipe)));
    } catch (formatError) {
      console.error('[RecipeAudit] 格式化菜谱详情失败', formatError);
      res.status(500).json({ code: 500, message: '数据格式异常，请联系管理员' });
    }
  } catch (error) {
    console.error('[RecipeAudit] 获取菜谱详情失败', error);
    res.status(500).json({ code: 500, message: '获取详情失败' });
  }
}

export async function auditRecipe(req: Request, res: Response) {
  const { id } = req.params;
  const numericId = parseInt(id);
  const { action, reason } = req.body;

  try {
    // 支持数字 ID 和 recipeKey 字符串两种查找方式
    const recipe = isNaN(numericId)
      ? await prisma.recipe.findUnique({ where: { recipeKey: id } })
      : await prisma.recipe.findUnique({ where: { id: numericId } });

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
    const adminId = getAdminId(req);
    const updateData: any = {
      status: newStatus,
      rejectReason: action === 'reject' ? reason : null,
      reviewedAt: new Date(),
      reviewedBy: adminId,
    };

    if (action === 'approve') {
      updateData.publishedAt = new Date();
    }

    await prisma.recipe.update({
      where: { id: recipe.id },
      data: updateData,
    });

    // 给作者发送审核通知
    if (recipe.authorId) {
      if (action === 'approve') {
        createNotification({
          userId: recipe.authorId,
          type: 'RECIPE_APPROVED',
          title: '你的菜谱已通过审核',
          content: `菜谱「${recipe.title}」已通过审核，现在所有人可见`,
          data: { recipeId: recipe.id, recipeTitle: recipe.title },
        });
      } else {
        createNotification({
          userId: recipe.authorId,
          type: 'RECIPE_REJECTED',
          title: '你的菜谱未通过审核',
          content: `菜谱「${recipe.title}」未通过审核${reason ? `：${reason}` : ''}`,
          data: { recipeId: recipe.id, recipeTitle: recipe.title, reason: reason || '' },
        });
      }
    }

    res.json(success(null, action === 'approve' ? '审核通过' : '已拒绝'));
  } catch (error) {
    console.error('[RecipeAudit] 审核操作失败', error);
    res.status(500).json({ code: 500, message: '操作失败' });
  }
}

function buildAuditHistory(recipe: any): any[] {
  const history: any[] = [];
  if (recipe.reviewedAt) {
    history.push({
      action: recipe.status === 'PUBLISHED' ? 'approve' : 'reject',
      reason: recipe.rejectReason || '',
      auditorName: (recipe as any)._auditorName || '管理员',
      createdAt: recipe.reviewedAt.getTime(),
    });
  }
  return history;
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
    // 审核记录 — 前端详情对话框展示
    auditHistory: buildAuditHistory(item),
  };
}
