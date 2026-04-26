import { Request, Response } from 'express';
import { paginated, success } from '../../../types/response';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RecipeListQuery {
  page?: string;
  pageSize?: string;
  status?: string;
  keyword?: string;
}

export async function getPendingRecipes(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const skip = (page - 1) * pageSize;

  try {
    const where: any = { status: 'PENDING' };

    // 关键字搜索
    if (req.query.keyword) {
      where.OR = [
        { title: { contains: req.query.keyword as string, mode: 'insensitive' } },
        { nickname: { contains: req.query.keyword as string, mode: 'insensitive' } }
      ];
    }

    const [data, total] = await Promise.all([
      prisma.userRecipe.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip,
        take: pageSize
      }),
      prisma.userRecipe.count({ where })
    ]);

    // 转换数据格式
    const formattedData = data.map(item => formatRecipeResponse(item));

    res.json(paginated(formattedData, { page, pageSize, total }));
  } catch (error) {
    console.error('[RecipeAudit] 获取待审核列表失败', error);
    res.json(paginated([], { page, pageSize, total: 0 }));
  }
}

export async function getProcessedRecipes(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const skip = (page - 1) * pageSize;
  const status = req.query.status as string;

  try {
    const where: any = {
      status: status === 'approved' ? 'APPROVED' : 'REJECTED'
    };

    // 关键字搜索
    if (req.query.keyword) {
      where.OR = [
        { title: { contains: req.query.keyword as string, mode: 'insensitive' } },
        { nickname: { contains: req.query.keyword as string, mode: 'insensitive' } }
      ];
    }

    const [data, total] = await Promise.all([
      prisma.userRecipe.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.userRecipe.count({ where })
    ]);

    // 转换数据格式
    const formattedData = data.map(item => formatRecipeResponse(item));

    res.json(paginated(formattedData, { page, pageSize, total }));
  } catch (error) {
    console.error('[RecipeAudit] 获取已审核列表失败', error);
    res.json(paginated([], { page, pageSize, total: 0 }));
  }
}

export async function getRecipeDetail(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const recipe = await prisma.userRecipe.findUnique({
      where: { recipeId: id }
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
  const adminName = (req as any).user?.name || '管理员';

  try {
    const recipe = await prisma.userRecipe.findUnique({
      where: { recipeId: id }
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

    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
    const updateData: any = {
      status: newStatus,
      rejectReason: action === 'reject' ? reason : null,
      updatedAt: new Date()
    };

    if (action === 'approve') {
      updateData.publishedAt = new Date();
    }

    await prisma.userRecipe.update({
      where: { recipeId: id },
      data: updateData
    });

    res.json(success(null, action === 'approve' ? '审核通过' : '已拒绝'));
  } catch (error) {
    console.error('[RecipeAudit] 审核操作失败', error);
    res.status(500).json({ code: 500, message: '操作失败' });
  }
}

// 格式化返回数据
function formatRecipeResponse(item: any) {
  return {
    _id: item.id.toString(),
    recipeId: item.recipeId,
    openid: item.openid,
    nickname: item.nickname || '美食爱好者',
    avatar: item.avatar || '',
    title: item.title,
    coverImage: item.coverImage || '',
    description: item.description || '',
    difficulty: item.difficulty === 'EASY' ? 'easy' : item.difficulty === 'HARD' ? 'hard' : 'normal',
    cookingTime: item.cookingTime,
    servings: item.servings,
    ingredients: item.ingredients,
    steps: item.steps,
    tips: item.tips || '',
    tags: item.tags || [],
    mealTimes: item.mealTimes || [],
    dishTypes: item.dishTypes || [],
    status: item.status === 'APPROVED' ? 'approved' : item.status === 'REJECTED' ? 'rejected' : 'pending',
    rejectReason: item.rejectReason || '',
    viewCount: item.viewCount,
    likeCount: item.likeCount,
    createdAt: item.createdAt.getTime(),
    updatedAt: item.updatedAt.getTime(),
    publishedAt: item.publishedAt ? item.publishedAt.getTime() : null
  };
}
