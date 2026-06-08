import { Request, Response } from 'express';
import { prisma } from '../../../lib/prisma';
import { paginated, success, notFound, badRequest } from '../../../types/response';

function recipeSelect() {
  return {
    id: true,
    title: true,
    coverImage: true,
    viewCount: true,
    collectCount: true,
    status: true,
    isHot: true,
    isFeatured: true,
    updatedAt: true,
  };
}

export async function getFeaturedRecipes(req: Request, res: Response) {
  res.setHeader('Deprecation', 'true');
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const keyword = String(req.query.keyword || '').trim();
  const where: any = { isDeleted: false, isFeatured: true };
  if (keyword) where.title = { contains: keyword, mode: 'insensitive' };

  const [total, recipes] = await Promise.all([
    prisma.recipe.count({ where }),
    prisma.recipe.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ updatedAt: 'desc' }],
      select: recipeSelect(),
    }),
  ]);

  res.json(paginated(recipes.map(recipe => ({
    id: recipe.id,
    weight: 0,
    note: '',
    addedBy: '',
    createdAt: recipe.updatedAt,
    recipe,
  })), { page, pageSize, total }, 'featured-recipes 已废弃，请使用 /recipes 的 isFeatured 字段'));
}

export async function addFeaturedRecipe(req: Request, res: Response) {
  res.setHeader('Deprecation', 'true');
  const recipeId = parseInt(req.body.recipeId);
  if (!recipeId) {
    res.status(400).json(badRequest('缺少 recipeId'));
    return;
  }

  const recipe = await prisma.recipe.update({
    where: { id: recipeId },
    data: { isFeatured: true },
  }).catch(() => null);

  if (!recipe) {
    res.status(404).json(notFound('菜谱不存在'));
    return;
  }

  res.json(success(recipe, '已设为精选'));
}

export async function removeFeaturedRecipe(req: Request, res: Response) {
  res.setHeader('Deprecation', 'true');
  const id = parseInt(req.params.id);
  await prisma.recipe.update({ where: { id }, data: { isFeatured: false } }).catch(() => null);
  res.json(success(null, '已取消精选'));
}

export async function updateFeaturedWeight(_req: Request, res: Response) {
  res.setHeader('Deprecation', 'true');
  res.json(success(null, 'featured-recipes 权重已废弃'));
}

export async function batchUpdateWeight(_req: Request, res: Response) {
  res.setHeader('Deprecation', 'true');
  res.json(success(null, 'featured-recipes 权重已废弃'));
}

export async function getHotRecipes(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const keyword = String(req.query.keyword || '').trim();
  const where: any = { isHot: true, isDeleted: false };
  if (keyword) where.title = { contains: keyword, mode: 'insensitive' };

  const [total, list] = await Promise.all([
    prisma.recipe.count({ where }),
    prisma.recipe.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ viewCount: 'desc' }, { collectCount: 'desc' }],
      select: recipeSelect(),
    }),
  ]);

  res.json(paginated(list, { page, pageSize, total }));
}

export async function toggleHot(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  const { isHot } = req.body as { isHot: boolean };
  const recipe = await prisma.recipe.update({ where: { id }, data: { isHot } }).catch(() => null);
  if (!recipe) {
    res.status(404).json(notFound('菜谱不存在'));
    return;
  }
  res.json(success({ isHot }, isHot ? '已设为热门' : '已取消热门'));
}

export async function batchToggleHot(req: Request, res: Response) {
  const { ids, isHot } = req.body as { ids: number[]; isHot: boolean };
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json(badRequest('请传入有效的 id 列表'));
    return;
  }

  const intIds = ids.map((id: any) => parseInt(id)).filter((id: number) => !isNaN(id));
  const result = await prisma.recipe.updateMany({ where: { id: { in: intIds } }, data: { isHot } });
  res.json(success({ count: result.count, isHot }, isHot ? '已设为热门' : '已取消热门'));
}

export async function searchRecipesForAdmin(req: Request, res: Response) {
  const keyword = String(req.query.keyword || '').trim();
  if (!keyword) {
    res.json(success([]));
    return;
  }

  const list = await prisma.recipe.findMany({
    where: {
      isDeleted: false,
      title: { contains: keyword, mode: 'insensitive' },
    },
    take: 20,
    select: recipeSelect(),
  });

  res.json(success(list));
}

export async function getAllRecipesForHot(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const keyword = String(req.query.keyword || '').trim();
  const where: any = { isDeleted: false };
  if (keyword) where.title = { contains: keyword, mode: 'insensitive' };

  const [total, list] = await Promise.all([
    prisma.recipe.count({ where }),
    prisma.recipe.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ viewCount: 'desc' }, { collectCount: 'desc' }],
      select: recipeSelect(),
    }),
  ]);

  res.json(paginated(list, { page, pageSize, total }));
}
