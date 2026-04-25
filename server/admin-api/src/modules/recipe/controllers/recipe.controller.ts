import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import { paginated, success, notFound, badRequest } from '../../../types/response';
import { ContentStatus, Difficulty } from '@prisma/client';

function mapRecipeToFrontend(recipe: any) {
  const rawIngredients: any[] = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const rawSteps: any[] = Array.isArray(recipe.steps) ? recipe.steps : [];
  return {
    ...recipe,
    difficulty: recipe.difficulty,
    dishType: recipe.tags?.[0] || recipe.category || '',
    dishTypes: recipe.tags || [],
    mealTimes: (recipe.tags || []).filter((t: string) =>
      ['breakfast', 'lunch', 'dinner', 'late_night'].includes(t)
    ),
    timeCost: recipe.cookingTime,
    fitnessMeal: (recipe.tags || []).includes('diet'),
    childrenMeal: (recipe.tags || []).includes('children'),
    ingredients: rawIngredients.map((ing: any) =>
      typeof ing === 'string'
        ? { name: ing, amount: '', unit: '', isOptional: false }
        : { name: ing.name || '', amount: ing.amount || '', unit: ing.unit || '', isOptional: ing.isOptional || false }
    ),
    steps: rawSteps.map((s: any, i: number) =>
      typeof s === 'string'
        ? { order: i + 1, content: s, image: '' }
        : { order: s.order || i + 1, content: s.content || '', image: s.image || '' }
    ),
    nutrition: recipe.nutrition || {},
  };
}

function buildPrismaWhere(query: any) {
  const where: Prisma.RecipeWhereInput = { isDeleted: false };
  if (query.status) where.status = query.status as ContentStatus;
  if (query.category) where.category = query.category;
  if (query.keyword) {
    where.OR = [
      { title: { contains: query.keyword, mode: 'insensitive' } },
      { description: { contains: query.keyword, mode: 'insensitive' } },
    ];
  }
  if (query.difficulty) where.difficulty = query.difficulty as Difficulty;
  return where;
}

export async function getRecipes(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const orderBy = (req.query.sort as string) || 'createdAt';
  const orderDir = req.query.order === 'asc' ? 'asc' : 'desc';
  const where = buildPrismaWhere(req.query);

  const [total, list] = await Promise.all([
    prisma.recipe.count({ where }),
    prisma.recipe.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { [orderBy]: orderDir },
    }),
  ]);

  res.json(paginated(list.map(mapRecipeToFrontend), { page, pageSize, total }));
}

export async function getRecipeById(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json(badRequest('无效的菜谱 ID'));
    return;
  }
  const recipe = await prisma.recipe.findUnique({ where: { id, isDeleted: false } });
  if (!recipe) {
    res.status(404).json(notFound('菜谱不存在'));
    return;
  }
  res.json(success(mapRecipeToFrontend(recipe)));
}

export async function createRecipe(req: Request, res: Response) {
  const body = req.body;
  if (!body.title) {
    res.status(400).json(badRequest('菜谱标题不能为空'));
    return;
  }

  const {
    title, description, coverImage, difficulty, cookingTime, servings,
    calories, cuisine, category, tips, status = 'DRAFT',
    ingredients = [], steps = [], nutrition,
    isFeatured, isAiGenerated, aiPrompt,
    dishType, dishTypes = [], mealTimes = [], fitnessMeal, childrenMeal,
  } = body;

  const tags: string[] = [...(dishTypes || [])];
  if (mealTimes?.length) tags.push(...mealTimes);
  if (fitnessMeal) tags.push('diet');
  if (childrenMeal) tags.push('children');

  const result = await prisma.recipe.create({
    data: {
      title,
      description,
      coverImage,
      difficulty: (difficulty as Difficulty) || 'MEDIUM',
      cookingTime: cookingTime || null,
      servings: servings || null,
      calories: calories || null,
      cuisine,
      category: dishType || category || null,
      tips,
      status: (status as ContentStatus) || 'DRAFT',
      isFeatured: isFeatured || false,
      isAiGenerated: isAiGenerated || false,
      aiPrompt,
      tags,
      nutrition: nutrition || undefined,
      ingredients: ingredients.map((ing: any) => ({
        name: ing.name || '',
        amount: ing.amount || '',
        unit: ing.unit || '',
        isOptional: ing.isOptional || false,
      })),
      steps: steps.map((s: any, i: number) =>
        typeof s === 'string'
          ? { order: i + 1, content: s, image: '' }
          : { order: s.order || i + 1, content: s.content || '', image: s.image || '' }
      ),
    },
  });

  res.json(success(mapRecipeToFrontend(result), '创建成功'));
}

export async function updateRecipe(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json(badRequest('无效的菜谱 ID'));
    return;
  }

  const existing = await prisma.recipe.findUnique({ where: { id, isDeleted: false } });
  if (!existing) {
    res.status(404).json(notFound('菜谱不存在'));
    return;
  }

  const body = req.body;
  const {
    title, description, coverImage, difficulty, cookingTime, servings,
    calories, cuisine, category, tips, status,
    ingredients = [], steps = [], nutrition,
    isFeatured, isAiGenerated, aiPrompt,
    dishType, dishTypes = [], mealTimes = [], fitnessMeal, childrenMeal,
  } = body;

  const tags: string[] = [...(dishTypes || [])];
  if (mealTimes?.length) tags.push(...mealTimes);
  if (fitnessMeal) tags.push('diet');
  if (childrenMeal) tags.push('children');

  const result = await prisma.recipe.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(coverImage !== undefined && { coverImage }),
      ...(difficulty !== undefined && { difficulty }),
      ...(cookingTime !== undefined && { cookingTime }),
      ...(servings !== undefined && { servings }),
      ...(calories !== undefined && { calories }),
      ...(cuisine !== undefined && { cuisine }),
      ...(tips !== undefined && { tips }),
      ...(status !== undefined && { status }),
      ...(isFeatured !== undefined && { isFeatured }),
      ...(isAiGenerated !== undefined && { isAiGenerated }),
      ...(aiPrompt !== undefined && { aiPrompt }),
      ...(category !== undefined && { category }),
      tags: tags.length ? tags : undefined,
      nutrition: nutrition || undefined,
      ingredients: ingredients.length > 0 ? ingredients.map((ing: any) => ({
        name: ing.name || '',
        amount: ing.amount || '',
        unit: ing.unit || '',
        isOptional: ing.isOptional || false,
      })) : undefined,
      steps: steps.length > 0 ? steps.map((s: any, i: number) =>
        typeof s === 'string'
          ? { order: i + 1, content: s, image: '' }
          : { order: s.order || i + 1, content: s.content || '', image: s.image || '' }
      ) : undefined,
    },
  });

  res.json(success(mapRecipeToFrontend(result), '更新成功'));
}

export async function deleteRecipe(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json(badRequest('无效的菜谱 ID'));
    return;
  }
  const existing = await prisma.recipe.findUnique({ where: { id, isDeleted: false } });
  if (!existing) {
    res.status(404).json(notFound('菜谱不存在'));
    return;
  }
  await prisma.recipe.update({ where: { id }, data: { isDeleted: true } });
  res.json(success(null, '删除成功'));
}

export async function batchDeleteRecipes(req: Request, res: Response) {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json(badRequest('请传入要删除的 ID 列表'));
    return;
  }
  const intIds = ids.map((id: any) => parseInt(id)).filter((id: number) => !isNaN(id));
  await prisma.recipe.updateMany({ where: { id: { in: intIds } }, data: { isDeleted: true } });
  res.json(success({ deleted: intIds.length }, `成功删除 ${intIds.length} 条记录`));
}

export async function publishRecipe(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  const result = await prisma.recipe.update({
    where: { id, isDeleted: false },
    data: { status: 'PUBLISHED', publishedAt: new Date() },
  }).catch(() => null);
  if (!result) {
    res.status(404).json(notFound('菜谱不存在'));
    return;
  }
  res.json(success(null, '发布成功'));
}

export async function offlineRecipe(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  const result = await prisma.recipe.update({
    where: { id, isDeleted: false },
    data: { status: 'OFFLINE' },
  }).catch(() => null);
  if (!result) {
    res.status(404).json(notFound('菜谱不存在'));
    return;
  }
  res.json(success(null, '下线成功'));
}
