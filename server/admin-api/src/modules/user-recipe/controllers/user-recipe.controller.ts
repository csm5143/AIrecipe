import { Request, Response } from 'express';
import { paginated, success } from '../../../types/response';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 生成自定义ID
function generateRecipeId(): string {
  return 'ur_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
}

export async function submitRecipe(req: Request, res: Response) {
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
    dishTypes
  } = req.body;

  const openid = (req as any).openid || req.headers['x-openid'] as string || 'anonymous';

  // 验证必填字段
  if (!title?.trim()) {
    res.status(400).json({ success: false, message: '请输入菜谱标题' });
    return;
  }
  if (!coverImage) {
    res.status(400).json({ success: false, message: '请上传封面图片' });
    return;
  }
  if (!ingredients || ingredients.length === 0) {
    res.status(400).json({ success: false, message: '请添加食材' });
    return;
  }
  if (!steps || steps.length === 0) {
    res.status(400).json({ success: false, message: '请添加步骤' });
    return;
  }

  const recipeId = generateRecipeId();

  try {
    const recipe = await prisma.userRecipe.create({
      data: {
        recipeId,
        openid,
        nickname: '美食爱好者',
        title: title.trim(),
        coverImage,
        description: description?.trim() || '',
        difficulty: difficulty === 'easy' ? 'EASY' : difficulty === 'hard' ? 'HARD' : 'NORMAL',
        cookingTime: parseInt(cookingTime) || 30,
        servings: parseInt(servings) || 2,
        ingredients: JSON.stringify(ingredients.filter((i: any) => i.name?.trim())),
        steps: JSON.stringify(steps.filter((s: any) => s.description?.trim())),
        tips: tips?.trim() || '',
        tags: JSON.stringify(tags || []),
        mealTimes: JSON.stringify(mealTimes || []),
        dishTypes: JSON.stringify(dishTypes || []),
        status: 'PENDING'
      }
    });

    res.json({
      success: true,
      message: '提交成功，等待审核',
      recipeId: recipe.recipeId
    });
  } catch (error) {
    console.error('[UserRecipe] 提交菜谱失败', error);
    res.status(500).json({ success: false, message: '提交失败' });
  }
}

export async function getMyRecipes(req: Request, res: Response) {
  const openid = (req as any).openid || req.headers['x-openid'] as string || 'anonymous';
  const status = req.query.status as string;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const skip = (page - 1) * pageSize;

  try {
    const where: any = { openid };

    if (status === 'pending') {
      where.status = 'PENDING';
    } else if (status === 'approved') {
      where.status = 'APPROVED';
    } else if (status === 'rejected') {
      where.status = 'REJECTED';
    }

    const [data, total] = await Promise.all([
      prisma.userRecipe.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.userRecipe.count({ where })
    ]);

    const formattedData = data.map(item => formatRecipeResponse(item));

    res.json({
      success: true,
      message: '获取成功',
      data: formattedData,
      total,
      hasMore: skip + data.length < total
    });
  } catch (error) {
    console.error('[UserRecipe] 获取我的菜谱失败', error);
    res.json({ success: false, message: '获取失败' });
  }
}

export async function getCommunityRecipes(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const skip = (page - 1) * pageSize;

  try {
    const [data, total] = await Promise.all([
      prisma.userRecipe.findMany({
        where: { status: 'APPROVED' },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.userRecipe.count({ where: { status: 'APPROVED' } })
    ]);

    const formattedData = data.map(item => formatRecipeResponse(item));

    res.json({
      success: true,
      message: '获取成功',
      data: formattedData,
      total,
      hasMore: skip + data.length < total
    });
  } catch (error) {
    console.error('[UserRecipe] 获取社区菜谱失败', error);
    res.json({ success: false, message: '获取失败' });
  }
}

export async function getRecipeDetail(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const recipe = await prisma.userRecipe.findUnique({
      where: { recipeId: id }
    });

    if (!recipe) {
      res.json({ success: false, message: '菜谱不存在' });
      return;
    }

    res.json({
      success: true,
      message: '获取成功',
      data: formatRecipeResponse(recipe)
    });
  } catch (error) {
    console.error('[UserRecipe] 获取菜谱详情失败', error);
    res.json({ success: false, message: '获取失败' });
  }
}

export async function deleteMyRecipe(req: Request, res: Response) {
  const { id } = req.params;
  const openid = (req as any).openid || req.headers['x-openid'] as string || 'anonymous';

  try {
    const recipe = await prisma.userRecipe.findUnique({
      where: { recipeId: id }
    });

    if (!recipe) {
      res.json({ success: false, message: '菜谱不存在' });
      return;
    }

    if (recipe.openid !== openid) {
      res.json({ success: false, message: '无权删除' });
      return;
    }

    if (recipe.status === 'APPROVED') {
      res.json({ success: false, message: '已通过的菜谱不能删除' });
      return;
    }

    await prisma.userRecipe.delete({
      where: { recipeId: id }
    });

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('[UserRecipe] 删除菜谱失败', error);
    res.json({ success: false, message: '删除失败' });
  }
}

export async function toggleLike(req: Request, res: Response) {
  const { id } = req.params;
  const openid = (req as any).openid || req.headers['x-openid'] as string || 'anonymous';

  try {
    const recipe = await prisma.userRecipe.findUnique({
      where: { recipeId: id }
    });

    if (!recipe) {
      res.json({ success: false, message: '菜谱不存在' });
      return;
    }

    // 检查是否已点赞
    const existingLike = await prisma.userRecipeLike.findUnique({
      where: {
        recipeId_openid: {
          recipeId: id,
          openid
        }
      }
    });

    let liked = false;
    let newLikeCount = recipe.likeCount;

    if (existingLike) {
      // 取消点赞
      await prisma.userRecipeLike.delete({
        where: { id: existingLike.id }
      });
      newLikeCount = Math.max(0, newLikeCount - 1);
    } else {
      // 添加点赞
      await prisma.userRecipeLike.create({
        data: { recipeId: id, openid }
      });
      newLikeCount = newLikeCount + 1;
      liked = true;
    }

    // 更新点赞数
    await prisma.userRecipe.update({
      where: { recipeId: id },
      data: { likeCount: newLikeCount }
    });

    res.json({
      success: true,
      message: liked ? '点赞成功' : '取消点赞',
      liked,
      likeCount: newLikeCount
    });
  } catch (error) {
    console.error('[UserRecipe] 点赞操作失败', error);
    res.json({ success: false, message: '操作失败' });
  }
}

export async function increaseViewCount(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const recipe = await prisma.userRecipe.update({
      where: { recipeId: id },
      data: { viewCount: { increment: 1 } }
    });

    res.json({
      success: true,
      message: '浏览量增加成功',
      viewCount: recipe.viewCount
    });
  } catch (error) {
    console.error('[UserRecipe] 增加浏览量失败', error);
    res.json({ success: false, message: '操作失败' });
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
    ingredients: typeof item.ingredients === 'string' ? JSON.parse(item.ingredients) : item.ingredients,
    steps: typeof item.steps === 'string' ? JSON.parse(item.steps) : item.steps,
    tips: item.tips || '',
    tags: typeof item.tags === 'string' ? JSON.parse(item.tags) : item.tags || [],
    mealTimes: typeof item.mealTimes === 'string' ? JSON.parse(item.mealTimes) : item.mealTimes || [],
    dishTypes: typeof item.dishTypes === 'string' ? JSON.parse(item.dishTypes) : item.dishTypes || [],
    status: item.status === 'APPROVED' ? 'approved' : item.status === 'REJECTED' ? 'rejected' : 'pending',
    rejectReason: item.rejectReason || '',
    viewCount: item.viewCount,
    likeCount: item.likeCount,
    createdAt: item.createdAt.getTime(),
    updatedAt: item.updatedAt.getTime(),
    publishedAt: item.publishedAt ? item.publishedAt.getTime() : null
  };
}
