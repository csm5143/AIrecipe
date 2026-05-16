import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import { paginated, success, notFound, badRequest } from '../../../types/response';
import { ContentStatus, Difficulty } from '@prisma/client';
import { getAdminId, getAdminName, createOperationLog, addToRecycleBin } from '../../../utils/adminHelper';
import { exportRecipes } from '../../../services/export.service';

function mapRecipeToFrontend(recipe: any) {
  const rawIngredients: any[] = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const rawSteps: any[] = Array.isArray(recipe.steps) ? recipe.steps : [];
  // dishTypes 为 null 时 fallback 到 category
  const dishTypes: string[] = Array.isArray(recipe.dishTypes) && recipe.dishTypes.length
    ? recipe.dishTypes
    : recipe.category ? [recipe.category]
    : [];
  return {
    ...recipe,
    difficulty: recipe.difficulty,
    dishType: dishTypes[0] || '',
    dishTypes,
    mealTimes: Array.isArray(recipe.mealTimes) ? recipe.mealTimes : [],
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
  if (query.dishType) where.dishTypes = { array_contains: query.dishType };
  if (query.keyword) {
    where.OR = [
      { title: { contains: query.keyword, mode: 'insensitive' } },
      { description: { contains: query.keyword, mode: 'insensitive' } },
    ];
  }
  if (query.difficulty) where.difficulty = query.difficulty as Difficulty;
  if (query.source) where.source = query.source;
  if (query.mealTime) where.mealTimes = { array_contains: query.mealTime };
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
    isFeatured,
    isHot,
    dishType, dishTypes = [], mealTimes = [], fitnessMeal, childrenMeal,
  } = body;

  const tags: string[] = [...(dishTypes || [])];
  if (mealTimes?.length) tags.push(...mealTimes);
  if (fitnessMeal) tags.push('diet');
  if (childrenMeal) tags.push('children');

  const result = await prisma.recipe.create({
    data: {
      recipeKey: 'r_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
      title,
      description,
      coverImage,
      difficulty: normalizeDifficulty(difficulty),
      cookingTime: cookingTime || null,
      servings: servings || null,
      calories: calories || null,
      cuisine,
      category: dishType || category || null,
      tips,
      status: normalizeStatus(status),
      isFeatured: isFeatured || false,
      isHot: isHot || false,
      tags,
      mealTimes: mealTimes?.length ? mealTimes : undefined,
      dishTypes: dishTypes?.length ? dishTypes : undefined,
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

  await createOperationLog(getAdminId(req), getAdminName(req), 'create', 'recipe', title, `创建了菜谱「${title}」`, req.ip || undefined);

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
    isFeatured, isHot, isAiGenerated, aiPrompt,
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
      ...(isHot !== undefined && { isHot }),
      ...(isAiGenerated !== undefined && { isAiGenerated }),
      ...(aiPrompt !== undefined && { aiPrompt }),
      ...(category !== undefined && { category }),
      ...(mealTimes !== undefined && { mealTimes }),
      ...(dishTypes !== undefined && { dishTypes }),
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

  await createOperationLog(getAdminId(req), getAdminName(req), 'update', 'recipe', existing.title, `编辑了菜谱「${existing.title}」`, req.ip || undefined);

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
  await addToRecycleBin(getAdminId(req), 'recipe', id, existing, undefined, 30);
  await createOperationLog(getAdminId(req), getAdminName(req), 'delete', 'recipe', existing.title, `删除了菜谱「${existing.title}」`, req.ip || undefined);
  res.json(success(null, '删除成功'));
}

export async function batchDeleteRecipes(req: Request, res: Response) {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json(badRequest('请传入要删除的 ID 列表'));
    return;
  }
  const intIds = ids.map((id: any) => parseInt(id)).filter((id: number) => !isNaN(id));
  const existing = await prisma.recipe.findMany({ where: { id: { in: intIds }, isDeleted: false } });
  await prisma.recipe.updateMany({ where: { id: { in: intIds } }, data: { isDeleted: true } });
  for (const r of existing) {
    await addToRecycleBin(getAdminId(req), 'recipe', r.id, r, undefined, 30);
    await createOperationLog(getAdminId(req), getAdminName(req), 'delete', 'recipe', r.title, `批量删除了菜谱「${r.title}」`, req.ip || undefined);
  }
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
  await createOperationLog(getAdminId(req), getAdminName(req), 'publish', 'recipe', result.title, `发布了菜谱「${result.title}」`, req.ip || undefined);
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
  await createOperationLog(getAdminId(req), getAdminName(req), 'offline', 'recipe', result.title, `下架了菜谱「${result.title}」`, req.ip || undefined);
  res.json(success(null, '下线成功'));
}

function normalizeDifficulty(raw: string | undefined | null): Difficulty {
  if (!raw) return 'MEDIUM';
  const upper = String(raw).toUpperCase() as Difficulty;
  if (upper === 'EASY' || upper === 'MEDIUM' || upper === 'HARD') return upper;
  return 'MEDIUM';
}

function normalizeStatus(raw: string | undefined | null): ContentStatus {
  if (!raw) return 'DRAFT';
  const upper = String(raw).toUpperCase() as ContentStatus;
  if (['ACTIVE', 'DRAFT', 'PUBLISHED', 'OFFLINE', 'DELETED'].includes(upper)) return upper;
  return 'DRAFT';
}

export async function importRecipes(req: Request, res: Response) {
  const items: any[] = Array.isArray(req.body) ? req.body : req.body.recipes || [];
  if (!items.length) {
    res.status(400).json(badRequest('请传入要导入的菜谱数组'));
    return;
  }
  const now = new Date();
  const data = items.map(item => ({
    recipeKey: 'r_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
    title: item.title || item.name || '',
    description: item.description || '',
    coverImage: item.coverImage || '',
    difficulty: normalizeDifficulty(item.difficulty),
    cookingTime: item.cookingTime || item.timeCost || null,
    servings: item.servings || null,
    calories: item.nutrition?.calories || item.calories || null,
    cuisine: item.cuisine || null,
    category: item.category || item.dishTypes?.[0] || null,
    tips: item.tips || null,
    nutrition: item.nutrition || undefined,
    ingredients: item.ingredients || [],
    steps: item.steps || [],
    tags: [...(item.dishTypes || []), ...(item.mealTimes || []), ...(item.tags || [])],
    mealTimes: item.mealTimes?.length ? item.mealTimes : undefined,
    dishTypes: item.dishTypes?.length ? item.dishTypes : undefined,
    goal: item.goal || null,
    ageBand: item.ageBand || null,
    isFeatured: item.isFeatured || false,
    isHot: item.isHot || false,
    status: normalizeStatus(item.status) || 'PUBLISHED',
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  }));
  await prisma.recipe.createMany({ data });
  await createOperationLog(getAdminId(req), getAdminName(req), 'create', 'recipe', 'batch', `批量导入了 ${data.length} 条菜谱`, req.ip || undefined);
  res.json(success({ imported: data.length }, `成功导入 ${data.length} 条记录`));
}

export async function exportRecipesHandler(req: Request, res: Response) {
  const format = req.query.format as string;
  if (format && !['csv', 'xlsx', 'json'].includes(format)) {
    res.status(400).json(badRequest('format 参数仅支持 csv、xlsx 或 json'));
    return;
  }

  const where = buildPrismaWhere(req.query);

  const recipes = await prisma.recipe.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, recipeKey: true, title: true, coverImage: true, description: true,
      difficulty: true, cookingTime: true, servings: true, calories: true,
      category: true, cuisine: true, tags: true, source: true, status: true,
      isFeatured: true, isHot: true, viewCount: true, collectCount: true,
      mealTimes: true, dishTypes: true, publishedAt: true, createdAt: true,
    },
  });

  const rows = recipes.map(r => ({
    ...r,
    title: r.title || '',
    coverImage: r.coverImage || '',
    description: r.description || '',
    cuisine: r.cuisine || '',
    category: r.category || '',
    tags: r.tags || [],
    mealTimes: r.mealTimes || [],
    dishTypes: r.dishTypes || [],
  }));

  const fmt = (format === 'csv' || format === 'json') ? format : 'xlsx';
  exportRecipes(res, fmt, rows);
}
