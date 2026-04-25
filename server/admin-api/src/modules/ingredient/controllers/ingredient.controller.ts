import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import { paginated, success, notFound, badRequest } from '../../../types/response';
import { ContentStatus } from '@prisma/client';

function mapIngredient(ing: any) {
  return {
    id: ing.id,
    name: ing.name,
    alias: ing.alias || '',
    coverImage: ing.coverImage || '',
    category: ing.category || '',
    subCategory: (ing.tags as string[] | null)?.find((t: string) =>
      ['vegetable', 'meat', 'seafood', 'grain', 'fruit', 'dairy', 'seasoning', 'other'].includes(t)
    ) || '',
    unit: ing.unit || '',
    calories: ing.calories || 0,
    protein: (ing.nutrition as any)?.protein || 0,
    fat: (ing.nutrition as any)?.fat || 0,
    carbs: (ing.nutrition as any)?.carbs || 0,
    fiber: (ing.nutrition as any)?.fiber || 0,
    sodium: (ing.nutrition as any)?.sodium || 0,
    nutrition: ing.nutrition || {},
    tags: ing.tags || [],
    status: ing.status || 'ACTIVE',
    remark: '',
    createdAt: ing.createdAt,
    updatedAt: ing.updatedAt,
  };
}

export async function getIngredients(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const keyword = (req.query.keyword as string) || '';
  const category = req.query.category as string;
  const status = req.query.status as string;

  const where: Prisma.IngredientWhereInput = { isDeleted: false };
  if (keyword) {
    where.OR = [
      { name: { contains: keyword, mode: 'insensitive' } },
      { alias: { contains: keyword, mode: 'insensitive' } },
    ];
  }
  if (category) {
    where.category = category;
  }
  if (status) {
    where.status = status as ContentStatus;
  }

  const [total, list] = await Promise.all([
    prisma.ingredient.count({ where }),
    prisma.ingredient.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  res.json({
    code: 200,
    message: 'success',
    data: { page, pageSize, total, list: list.map(mapIngredient) },
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    timestamp: Date.now(),
  });
}

export async function getIngredientById(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json(badRequest('无效的食材 ID'));
    return;
  }

  const ingredient = await prisma.ingredient.findUnique({ where: { id, isDeleted: false } });
  if (!ingredient) {
    res.status(404).json(notFound('食材不存在'));
    return;
  }

  res.json(success(mapIngredient(ingredient)));
}

export async function createIngredient(req: Request, res: Response) {
  const body = req.body;
  const {
    name, alias, coverImage, category, unit, calories,
    protein, fat, carbs, fiber, sodium, status = 'ACTIVE',
  } = body;

  if (!name) {
    res.status(400).json(badRequest('食材名称不能为空'));
    return;
  }

  const existing = await prisma.ingredient.findFirst({
    where: { name, isDeleted: false },
  });
  if (existing) {
    res.status(409).json({ code: 409, message: '食材已存在', timestamp: Date.now() });
    return;
  }

  const result = await prisma.ingredient.create({
    data: {
      name,
      alias: alias || null,
      coverImage: coverImage || null,
      category: category || 'other',
      unit: unit || null,
      calories: calories || null,
      nutrition: { protein, fat, carbs, fiber, sodium },
      status: (status as ContentStatus) || 'ACTIVE',
    },
  });

  res.json(success({ id: result.id }, '创建成功'));
}

export async function updateIngredient(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json(badRequest('无效的食材 ID'));
    return;
  }

  const existing = await prisma.ingredient.findUnique({ where: { id, isDeleted: false } });
  if (!existing) {
    res.status(404).json(notFound('食材不存在'));
    return;
  }

  const { name, alias, coverImage, category, unit, calories, protein, fat, carbs, fiber, sodium, status } = req.body;

  const result = await prisma.ingredient.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(alias !== undefined && { alias }),
      ...(coverImage !== undefined && { coverImage }),
      ...(category !== undefined && { category }),
      ...(unit !== undefined && { unit }),
      ...(calories !== undefined && { calories }),
      ...(status !== undefined && { status }),
      ...(protein !== undefined || fat !== undefined || carbs !== undefined || fiber !== undefined || sodium !== undefined
        ? {
            nutrition: {
              ...(existing.nutrition as object || {}),
              ...(protein !== undefined && { protein }),
              ...(fat !== undefined && { fat }),
              ...(carbs !== undefined && { carbs }),
              ...(fiber !== undefined && { fiber }),
              ...(sodium !== undefined && { sodium }),
            },
          }
        : {}),
    },
  });

  res.json(success({ id: result.id }, '更新成功'));
}

export async function deleteIngredient(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json(badRequest('无效的食材 ID'));
    return;
  }

  const existing = await prisma.ingredient.findUnique({ where: { id, isDeleted: false } });
  if (!existing) {
    res.status(404).json(notFound('食材不存在'));
    return;
  }

  await prisma.ingredient.update({
    where: { id },
    data: { isDeleted: true },
  });

  res.json(success(null, '删除成功'));
}

export async function batchImportIngredients(req: Request, res: Response) {
  const items: any[] = req.body;
  if (!Array.isArray(items)) {
    res.status(400).json(badRequest('请传入食材数组'));
    return;
  }

  const categoryMap: Record<string, string> = {
    meat: 'meat', egg_dairy: 'dairy', egg: 'dairy', dairy: 'dairy',
    vegetable: 'vegetable', seafood: 'seafood', grain: 'grain', staple: 'grain',
    fruit: 'fruit', fungus: 'fungus', soy: 'soy',
    seasoning: 'seasoning', medicinal: 'seasoning', nut: 'nut',
    other: 'other',
  };

  let imported = 0;
  let skipped = 0;

  for (const item of items) {
    if (!item.name) { skipped++; continue; }

    const exists = await prisma.ingredient.findFirst({ where: { name: item.name, isDeleted: false } });
    if (exists) { skipped++; continue; }

    await prisma.ingredient.create({
      data: {
        name: item.name,
        alias: item.alias || null,
        category: categoryMap[item.category] || 'other',
        unit: item.unit || null,
        calories: item.calories || null,
        nutrition: {
          protein: item.protein || 0,
          fat: item.fat || 0,
          carbs: item.carbs || 0,
          fiber: item.fiber || 0,
          sodium: item.sodium || 0,
        },
        status: item.selected === false ? 'OFFLINE' : 'ACTIVE',
      },
    });
    imported++;
  }

  res.json({
    code: 200,
    message: `导入完成：新增 ${imported} 条，跳过 ${skipped} 条`,
    data: { imported, skipped },
    timestamp: Date.now(),
  });
}
