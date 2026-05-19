import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import { paginated, success, notFound, badRequest } from '../../../types/response';
import { ContentStatus } from '@prisma/client';
import { getAdminId, getAdminName, createOperationLog, addToRecycleBin } from '../../../utils/adminHelper';
import { exportIngredients } from '../../../services/export.service';

function mapIngredient(ing: any) {
  return {
    id: ing.id,
    name: ing.name,
    alias: ing.alias || '',
    subCategory: ing.subCategory || '',
    coverImage: ing.coverImage || '',
    category: ing.category || '',
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

  const where: Prisma.IngredientWhereInput = {};
  if (keyword) {
    where.OR = [
      { name: { contains: keyword, mode: 'insensitive' } },
      { alias: { contains: keyword, mode: 'insensitive' } },
    ];
  }
  if (category) {
    where.category = category;
  }
  if (status && typeof status === 'string') {
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

  res.json(paginated(list.map(mapIngredient), { page, pageSize, total }));
}

export async function getIngredientById(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json(badRequest('无效的食材 ID'));
    return;
  }

  const ingredient = await prisma.ingredient.findUnique({ where: { id } });
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
    where: { name },
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

  const adminId = getAdminId(req);
  const adminName = getAdminName(req);
  await createOperationLog(adminId, adminName, 'create', 'ingredient', String(result.id), `新增食材：${name}`, req.ip || undefined);

  res.json(success({ id: result.id }, '创建成功'));
}

export async function updateIngredient(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json(badRequest('无效的食材 ID'));
    return;
  }

  const existing = await prisma.ingredient.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json(notFound('食材不存在'));
    return;
  }

  const { name, alias, coverImage, category, unit, calories, protein, fat, carbs, fiber, sodium, status } = req.body;

  const adminId = getAdminId(req);
  const adminName = getAdminName(req);

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

  await createOperationLog(adminId, adminName, 'update', 'ingredient', result.name, `更新了食材「${result.name}」的资料`, req.ip || undefined);

  res.json(success({ id: result.id }, '更新成功'));
}

export async function deleteIngredient(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json(badRequest('无效的食材 ID'));
    return;
  }

  const existing = await prisma.ingredient.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json(notFound('食材不存在'));
    return;
  }

  const adminId = getAdminId(req);
  const adminName = getAdminName(req);

  await addToRecycleBin(adminId, 'ingredient', id, existing, undefined, 30);
  await createOperationLog(adminId, adminName, 'delete', 'ingredient', existing.name, `删除了食材「${existing.name}」`, req.ip || undefined);

  res.json(success(null, '删除成功'));
}

export async function previewImportIngredients(req: Request, res: Response) {
  const { items } = req.body as { items: any[] };
  if (!Array.isArray(items)) {
    res.status(400).json(badRequest('请传入食材数组'));
    return;
  }

  const duplicates: { name: string; existingId: number }[] = [];

  for (const item of items) {
    if (!item.name) continue;
    const existing = await prisma.ingredient.findFirst({ where: { name: item.name } });
    if (existing) {
      duplicates.push({ name: item.name, existingId: existing.id });
    }
  }

  res.json(success({
    total: items.filter((i: any) => i.name).length,
    duplicateCount: duplicates.length,
    duplicates,
  }));
}

export async function batchImportIngredients(req: Request, res: Response) {
  const { items, overwrite = false } = req.body as { items: any[]; overwrite?: boolean };
  if (!Array.isArray(items)) {
    res.status(400).json(badRequest('请传入食材数组'));
    return;
  }

  // 保持 JSON 中的原始 category 值，只对部分值做标准化
  const categoryMap: Record<string, string> = {
    meat: 'meat', egg_dairy: 'egg_dairy', egg: 'egg_dairy', dairy: 'egg_dairy',
    vegetable: 'vegetable', seafood: 'seafood', grain: 'grain', staple: 'staple',
    fruit: 'fruit', fungus: 'fungus', soy: 'soy', nut: 'nut',
    seasoning: 'seasoning', medicinal: 'medicinal',
    other: 'other',
  };

  let imported = 0;
  let updated = 0;
  let skipped = 0;

  for (const item of items) {
    if (!item.name) { skipped++; continue; }

    const mappedCategory = categoryMap[item.category] || 'other';
    const nutritionData = {
      protein: item.protein || 0,
      fat: item.fat || 0,
      carbs: item.carbs || 0,
      fiber: item.fiber || 0,
      sodium: item.sodium || 0,
    };
    // 支持 aliases（数组）和 alias（字符串）两种格式
    const aliasValue = Array.isArray(item.aliases)
      ? item.aliases.join(',')
      : (item.alias || null);
    // selected: false = INACTIVE, selected: true/undefined = ACTIVE
    const mappedStatus = (item.selected === false ? 'INACTIVE' : 'ACTIVE') as any;

    const existing = await prisma.ingredient.findFirst({ where: { name: item.name } });

    if (existing) {
      if (overwrite) {
        await prisma.ingredient.update({
          where: { id: existing.id },
          data: {
            alias: aliasValue,
            subCategory: item.subCategory || null,
            category: mappedCategory,
            unit: item.unit || null,
            calories: item.calories || null,
            nutrition: nutritionData as Prisma.InputJsonValue,
            status: mappedStatus,
          },
        });
        updated++;
      } else {
        skipped++;
      }
    } else {
      await prisma.ingredient.create({
        data: {
          name: item.name,
          alias: aliasValue,
          subCategory: item.subCategory || null,
          category: mappedCategory,
          unit: item.unit || null,
          calories: item.calories || null,
          nutrition: nutritionData as Prisma.InputJsonValue,
          status: mappedStatus,
        },
      });
      imported++;
    }
  }

  const action = overwrite ? '覆盖导入' : '导入';
  await createOperationLog(getAdminId(req), getAdminName(req), 'create', 'ingredient', 'batch', `批量${action}了 ${imported} 条食材，更新 ${updated} 条，跳过 ${skipped} 条`, req.ip || undefined);

  res.json({
    code: 200,
    message: overwrite
      ? `导入完成：新增 ${imported} 条，覆盖 ${updated} 条`
      : `导入完成：新增 ${imported} 条，跳过 ${skipped} 条（已有食材）`,
    data: { imported, updated, skipped },
    timestamp: Date.now(),
  });
}

export async function batchDeleteIngredients(req: Request, res: Response) {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json(badRequest('请传入要删除的 ID 列表'));
    return;
  }

  const intIds = ids.map((id: any) => parseInt(id)).filter((id: number) => !isNaN(id));
  if (intIds.length === 0) {
    res.status(400).json(badRequest('ID 列表无效'));
    return;
  }

  const existing = await prisma.ingredient.findMany({ where: { id: { in: intIds } } });
  const adminId = getAdminId(req);
  const adminName = getAdminName(req);

  for (const ing of existing) {
    await addToRecycleBin(adminId, 'ingredient', ing.id, ing, undefined, 30);
    await createOperationLog(adminId, adminName, 'delete', 'ingredient', ing.name, `批量删除了食材「${ing.name}」`, req.ip || undefined);
  }

  await prisma.ingredient.deleteMany({ where: { id: { in: intIds } } });

  res.json(success({ deleted: existing.length }, `成功删除 ${existing.length} 条记录`));
}

export async function exportIngredientsHandler(req: Request, res: Response) {
  const format = req.query.format as string;
  if (format && !['csv', 'xlsx', 'json'].includes(format)) {
    res.status(400).json(badRequest('format 参数仅支持 csv、xlsx 或 json'));
    return;
  }

  const keyword = (req.query.keyword as string) || '';
  const category = req.query.category as string;
  const status = req.query.status as string;

  const where: Prisma.IngredientWhereInput = {};
  if (keyword) {
    where.OR = [
      { name: { contains: keyword, mode: 'insensitive' } },
      { alias: { contains: keyword, mode: 'insensitive' } },
    ];
  }
  if (category) where.category = category;
  if (status) where.status = status as ContentStatus;

  const ingredients = await prisma.ingredient.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  const rows = ingredients.map(ing => mapIngredient(ing));

  const fmt = (format === 'csv' || format === 'json') ? format : 'xlsx';
  exportIngredients(res, fmt, rows);
}

/**
 * 获取小程序端食材列表（轻量版，无需分页）
 * GET /v1/app/ingredients
 */
export async function getAppIngredients(req: Request, res: Response) {
  try {
    const keyword = (req.query.keyword as string) || '';
    const category = (req.query.category as string) || '';
    const requestedTake = parseInt(req.query.pageSize as string) || 1000;
    const take = Math.min(requestedTake, 1000);

    console.log(`[getAppIngredients] req.query:`, req.query, `| take: ${take}`);

    const where: any = {};
    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { alias: { contains: keyword, mode: 'insensitive' } },
      ];
    }
    if (category) {
      where.category = category;
    }

    const countAll = await prisma.ingredient.count({ where });
    console.log(`[getAppIngredients] countAll=${countAll}, take=${take}`);

    const ingredients = await prisma.ingredient.findMany({
      where,
      select: {
        id: true,
        name: true,
        alias: true,
        subCategory: true,
        category: true,
        unit: true,
      },
      orderBy: { name: 'asc' },
      take,
    });

    console.log(`[getAppIngredients] returning ${ingredients.length} items`);

    const result = ingredients.map(ing => ({
      id: ing.id,
      name: ing.name,
      alias: ing.alias || '',
      subCategory: ing.subCategory || '',
      category: ing.category || 'other',
      unit: ing.unit || '',
    }));

    res.json(success(result));
  } catch (error) {
    console.error('[Ingredient] 获取小程序食材列表失败:', error);
    res.status(500).json(badRequest('获取失败'));
  }
}
