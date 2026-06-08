import { Request, Response } from 'express';
import { Difficulty } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import { badRequest, notFound, paginated, success } from '../../../types/response';
import { createNotification } from '../../../services/notification.service';
import { logUserActivity } from '../../../services/activityLog.service';

type RecipeStatusInput = 'draft' | 'pending';

function normalizeDifficulty(value: string): Difficulty {
  switch (value) {
    case 'easy':
      return Difficulty.EASY;
    case 'hard':
      return Difficulty.HARD;
    default:
      return Difficulty.MEDIUM;
  }
}

function normalizeSubmitStatus(value: unknown): 'DRAFT' | 'PENDING' {
  return value === 'draft' ? 'DRAFT' : 'PENDING';
}

function buildRecipeData(body: any, statusInput: RecipeStatusInput) {
  const status = normalizeSubmitStatus(statusInput);
  const title = (body.title || '').toString().trim();
  const imageUrls = normalizeImageUrls(body.imageUrls);
  const steps =
    Array.isArray(body.steps) && body.steps.length > 0
      ? body.steps
      : imageUrls.map((url, index) => ({
          step: index + 1,
          description: '',
          image: url,
        }));

  if (status === 'PENDING' && !title) {
    throw new Error('Title is required before submitting for review');
  }

  return {
    title: title || 'Untitled recipe',
    coverImage: body.coverImage || imageUrls[0] || '',
    description: body.description?.toString().trim() || '',
    difficulty: normalizeDifficulty(body.difficulty),
    cookingTime: parseInt(body.cookingTime) || 30,
    servings: parseInt(body.servings) || 2,
    ingredients: Array.isArray(body.ingredients) ? body.ingredients : [],
    steps,
    tips: body.tips || '',
    tags: Array.isArray(body.tags) ? body.tags : [],
    mealTimes: Array.isArray(body.mealTimes) ? body.mealTimes : [],
    dishTypes: Array.isArray(body.dishTypes) ? body.dishTypes : [],
    status,
    publishedAt: status === 'PENDING' ? null : undefined,
  };
}

function normalizeImageUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => item?.toString().trim() || '')
    .filter(Boolean);
}

function imageUrlsFromSteps(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item: any) => item?.image || item?.imageUrl || '')
    .map((url: any) => url?.toString().trim() || '')
    .filter(Boolean);
}

async function getAuthor(userId: number) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { nickname: true, avatar: true },
  });
}

export async function getMyRecipes(req: Request, res: Response) {
  const userId = (req as any).userId;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);
  const status = req.query.status?.toString().toUpperCase();

  const where: any = {
    source: 'USER',
    authorId: userId,
    isDeleted: false,
  };

  if (status) where.status = status;

  try {
    const [data, total] = await Promise.all([
      prisma.recipe.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.recipe.count({ where }),
    ]);

    res.json(paginated(data.map(formatRecipeResponse), { page, pageSize, total }));
  } catch (error) {
    console.error('[UserRecipe] getMyRecipes failed', error);
    res.status(500).json(badRequest('Failed to load my recipes'));
  }
}

export async function getCommunityRecipes(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);

  try {
    const where = {
      source: 'USER',
      status: 'PUBLISHED',
      isDeleted: false,
    } as any;
    const [data, total] = await Promise.all([
      prisma.recipe.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.recipe.count({ where }),
    ]);

    res.json(paginated(data.map(formatRecipeResponse), { page, pageSize, total }));
  } catch (error) {
    console.error('[UserRecipe] getCommunityRecipes failed', error);
    res.status(500).json(badRequest('Failed to load community recipes'));
  }
}

export async function getRecipeDetail(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json(badRequest('Invalid recipe id'));
    return;
  }

  const recipe = await prisma.recipe.findFirst({
    where: { id, isDeleted: false },
  });

  if (!recipe) {
    res.status(404).json(notFound('Recipe not found'));
    return;
  }

  res.json(success(formatRecipeResponse(recipe)));
}

export async function submitRecipe(req: Request, res: Response) {
  const userId = (req as any).userId;
  const submitStatus: RecipeStatusInput =
    req.body.status === 'draft' ? 'draft' : 'pending';

  try {
    const author = await getAuthor(userId);
    const recipe = await prisma.recipe.create({
      data: {
        recipeKey: 'ur_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10),
        source: 'USER',
        authorId: userId,
        authorName: author?.nickname || 'Food lover',
        authorAvatar: author?.avatar || '',
        ...buildRecipeData(req.body, submitStatus),
      },
    });

    logUserActivity({
      userId,
      action: submitStatus === 'draft' ? 'draft_recipe' : 'upload_recipe',
      targetId: String(recipe.id),
      detail: `${submitStatus === 'draft' ? '保存草稿' : '上传菜谱'}「${recipe.title}」`,
    });
    res.json(success({ id: recipe.id, recipeId: recipe.id }, submitStatus === 'draft' ? 'Draft saved' : 'Submitted for review'));
  } catch (error: any) {
    console.error('[UserRecipe] submitRecipe failed', error);
    res.status(400).json(badRequest(error.message || 'Failed to submit recipe'));
  }
}

export async function updateMyRecipe(req: Request, res: Response) {
  const userId = (req as any).userId;
  const id = parseInt(req.params.id);
  const submitStatus: RecipeStatusInput =
    req.body.status === 'draft' ? 'draft' : 'pending';

  if (isNaN(id)) {
    res.status(400).json(badRequest('Invalid recipe id'));
    return;
  }

  try {
    const existing = await prisma.recipe.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) {
      res.status(404).json(notFound('Recipe not found'));
      return;
    }
    if (existing.authorId !== userId) {
      res.status(403).json(badRequest('No permission to update this recipe'));
      return;
    }
    if (existing.status === 'PUBLISHED') {
      res.status(400).json(badRequest('Published recipes cannot be edited here'));
      return;
    }

    const updated = await prisma.recipe.update({
      where: { id },
      data: buildRecipeData(req.body, submitStatus),
    });

    res.json(success(formatRecipeResponse(updated), submitStatus === 'draft' ? 'Draft saved' : 'Submitted for review'));
  } catch (error: any) {
    console.error('[UserRecipe] updateMyRecipe failed', error);
    res.status(400).json(badRequest(error.message || 'Failed to update recipe'));
  }
}

export async function deleteMyRecipe(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  const userId = (req as any).userId;

  if (isNaN(id)) {
    res.status(400).json(badRequest('Invalid recipe id'));
    return;
  }

  const recipe = await prisma.recipe.findUnique({ where: { id } });
  if (!recipe || recipe.isDeleted) {
    res.status(404).json(notFound('Recipe not found'));
    return;
  }
  if (recipe.authorId !== userId) {
    res.status(403).json(badRequest('No permission to delete this recipe'));
    return;
  }
  if (recipe.status === 'PUBLISHED') {
    res.status(400).json(badRequest('Published recipes cannot be deleted here'));
    return;
  }

  await prisma.recipe.delete({ where: { id } });
  res.json(success(null, 'Recipe deleted'));
}

export async function toggleLike(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  const userId = (req as any).userId;

  if (isNaN(id)) {
    res.status(400).json(badRequest('Invalid recipe id'));
    return;
  }

  const recipe = await prisma.recipe.findUnique({ where: { id } });
  if (!recipe || recipe.isDeleted) {
    res.status(404).json(notFound('Recipe not found'));
    return;
  }

  const existingLike = await prisma.favorite.findUnique({
    where: { userId_recipeId: { userId, recipeId: id } },
  });

  let liked = false;
  let favoriteCount = recipe.favoriteCount || 0;

  if (existingLike) {
    await prisma.favorite.delete({ where: { id: existingLike.id } });
    favoriteCount = Math.max(0, favoriteCount - 1);
  } else {
    await prisma.favorite.create({ data: { userId, recipeId: id } });
    favoriteCount += 1;
    liked = true;

    // 通知菜谱作者（不自赞）
    if (recipe.authorId && recipe.authorId !== userId) {
      const liker = await prisma.user.findUnique({
        where: { id: userId },
        select: { nickname: true },
      });
      createNotification({
        userId: recipe.authorId,
        type: 'RECIPE_LIKED',
        title: '有人赞了你的菜谱',
        content: `${liker?.nickname || '有用户'} 赞了你的菜谱「${recipe.title}」`,
        data: { recipeId: recipe.id, recipeTitle: recipe.title, likerId: userId, likerName: liker?.nickname || '' },
      });
    }
  }

  await prisma.recipe.update({
    where: { id },
    data: { favoriteCount },
  });

  res.json(success({ liked, likeCount: favoriteCount }));
}

export async function increaseViewCount(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json(badRequest('Invalid recipe id'));
    return;
  }

  const recipe = await prisma.recipe.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });

  res.json(success({ viewCount: recipe.viewCount }));
}

function formatRecipeResponse(item: any) {
  return {
    id: item.id,
    recipeId: item.recipeKey,
    source: item.source,
    authorId: item.authorId,
    authorName: item.authorName || 'Food lover',
    authorAvatar: item.authorAvatar || '',
    title: item.title,
    coverImage: item.coverImage || '',
    description: item.description || '',
    difficulty: item.difficulty?.toLowerCase() || 'normal',
    cookingTime: item.cookingTime,
    servings: item.servings,
    ingredients: item.ingredients || [],
    steps: item.steps || [],
    imageUrls: imageUrlsFromSteps(item.steps),
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
