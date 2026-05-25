import { Request, Response } from 'express';
import { prisma } from '../../../lib/prisma';
import { paginated, success, notFound, badRequest } from '../../../types/response';
import { getAdminName } from '../../../utils/adminHelper';

export async function getFeaturedRecipes(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const { keyword } = req.query;

  const where: any = {};
  if (keyword) {
    where.recipe = { title: { contains: String(keyword), mode: 'insensitive' } };
  }

  const [total, list] = await Promise.all([
    prisma.featuredRecipe.count({ where }),
    prisma.featuredRecipe.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { weight: 'desc' },
      include: {
        recipe: {
          select: {
            id: true,
            title: true,
            coverImage: true,
            viewCount: true,
            collectCount: true,
            status: true,
          },
        },
      },
    }),
  ]);

  const mapped = list.map((f) => ({
    id: f.id,
    weight: f.weight,
    note: f.note,
    addedBy: f.addedBy,
    createdAt: f.createdAt,
    recipe: f.recipe,
  }));

  res.json(paginated(mapped, { page, pageSize, total }));
}

export async function addFeaturedRecipe(req: Request, res: Response) {
  const { recipeId, note } = req.body as { recipeId: number; note?: string };

  if (!recipeId) {
    res.status(400).json(badRequest('缺少 recipeId'));
    return;
  }

  const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
  if (!recipe) {
    res.status(404).json(notFound('菜谱不存在'));
    return;
  }

  const existing = await prisma.featuredRecipe.findUnique({ where: { recipeId } });
  if (existing) {
    res.status(409).json(badRequest('该菜谱已在精选列表中'));
    return;
  }

  const featured = await prisma.featuredRecipe.create({
    data: {
      recipeId,
      note: note || null,
      addedBy: getAdminName(req) || null,
    },
    include: { recipe: { select: { id: true, title: true } } },
  });

  res.json(success(featured, '已添加到精选'));
}

export async function removeFeaturedRecipe(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  const existing = await prisma.featuredRecipe.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json(notFound('记录不存在'));
    return;
  }

  await prisma.featuredRecipe.delete({ where: { id } });
  res.json(success(null, '已从精选移除'));
}

export async function updateFeaturedWeight(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  const { weight, note } = req.body as { weight: number; note?: string };

  if (weight !== undefined && Number.isNaN(weight)) {
    res.status(400).json(badRequest('weight 参数无效'));
    return;
  }

  const existing = await prisma.featuredRecipe.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json(notFound('记录不存在'));
    return;
  }

  const data: any = {};
  if (weight !== undefined) data.weight = weight;
  if (note !== undefined) data.note = note;
  await prisma.featuredRecipe.update({ where: { id }, data });
  res.json(success(null, '已更新'));
}

export async function batchUpdateWeight(req: Request, res: Response) {
  const items = req.body as { id: number; weight: number }[];

  if (!Array.isArray(items)) {
    res.status(400).json(badRequest('请传入数组'));
    return;
  }

  await Promise.all(
    items.map(({ id, weight }) =>
      prisma.featuredRecipe.updateMany({ where: { id }, data: { weight } })
    )
  );

  res.json(success(null, '权重批量更新完成'));
}

// ---

export async function getHotRecipes(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const { keyword } = req.query;

  const where: any = { isHot: true };
  if (keyword) {
    where.title = { contains: String(keyword), mode: 'insensitive' };
  }

  const [total, list] = await Promise.all([
    prisma.recipe.count({ where: { ...where, isDeleted: false } }),
    prisma.recipe.findMany({
      where: { ...where, isDeleted: false },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ viewCount: 'desc' }, { collectCount: 'desc' }],
      select: {
        id: true,
        title: true,
        coverImage: true,
        viewCount: true,
        collectCount: true,
        status: true,
        isHot: true,
        isFeatured: true,
      },
    }),
  ]);

  res.json(paginated(list, { page, pageSize, total }));
}

export async function toggleHot(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  const { isHot } = req.body as { isHot: boolean };

  const recipe = await prisma.recipe.findUnique({ where: { id } });
  if (!recipe) {
    res.status(404).json(notFound('菜谱不存在'));
    return;
  }

  await prisma.recipe.update({ where: { id }, data: { isHot } });
  res.json(success({ isHot }, isHot ? '已设为热门' : '已取消热门'));
}

export async function batchToggleHot(req: Request, res: Response) {
  try {
    const { ids, isHot } = req.body as { ids: number[]; isHot: boolean };

    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json(badRequest('请传入有效的 id 列表'));
      return;
    }

    const intIds = ids.map((id: any) => parseInt(id)).filter((id: number) => !isNaN(id));
    if (intIds.length === 0) {
      res.status(400).json(badRequest('id 列表无效'));
      return;
    }

    await prisma.recipe.updateMany({ where: { id: { in: intIds } }, data: { isHot } });
    res.json(success({ count: intIds.length, isHot }, isHot ? '已设为热门' : '已取消热门'));
  } catch (error: any) {
    console.error('[Featured] batchToggleHot 失败:', error);
    res.status(500).json(badRequest(error?.message || '操作失败'));
  }
}

// ---

export async function searchRecipesForAdmin(req: Request, res: Response) {
  const { keyword } = req.query;

  if (!keyword || String(keyword).trim().length === 0) {
    res.json(success([]));
    return;
  }

  const list = await prisma.recipe.findMany({
    where: {
      isDeleted: false,
      title: { contains: String(keyword), mode: 'insensitive' },
    },
    take: 20,
    select: {
      id: true,
      title: true,
      coverImage: true,
      viewCount: true,
      isHot: true,
      isFeatured: true,
    },
  });

  res.json(success(list));
}

export async function getAllRecipesForHot(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const { keyword } = req.query;

  const where: any = { isDeleted: false };
  if (keyword) {
    where.title = { contains: String(keyword), mode: 'insensitive' };
  }

  const [total, list] = await Promise.all([
    prisma.recipe.count({ where }),
    prisma.recipe.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ viewCount: 'desc' }, { collectCount: 'desc' }],
      select: {
        id: true,
        title: true,
        coverImage: true,
        viewCount: true,
        collectCount: true,
        status: true,
        isHot: true,
        isFeatured: true,
      },
    }),
  ]);

  res.json(paginated(list, { page, pageSize, total }));
}
