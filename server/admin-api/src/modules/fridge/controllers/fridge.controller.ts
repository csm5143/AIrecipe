import { Request, Response } from 'express';
import { prisma } from '../../../lib/prisma';
import { success, paginated, notFound, badRequest } from '../../../types/response';
import { wxAuthenticate } from '../../wx/middleware/wxAuth.middleware';

// ============ 冰箱食材 CRUD ============

/**
 * 获取当前用户的冰箱食材列表
 * GET /v1/app/fridge
 */
export async function getFridgeItems(req: Request, res: Response) {
  const userId = (req as any).userId;

  try {
    const items = await prisma.fridgeItem.findMany({
      where: { userId },
      orderBy: { addedAt: 'desc' },
    });

    const result = items.map(item => ({
      id: String(item.id),
      name: item.name,
      amount: item.amount || '',
      unit: item.unit || '',
      category: item.category || 'other',
      addedAt: item.addedAt.getTime(),
    }));

    res.json(success(result));
  } catch (error) {
    console.error('[Fridge] 获取冰箱食材失败:', error);
    res.status(500).json(badRequest('获取失败'));
  }
}

/**
 * 添加食材到冰箱
 * POST /v1/app/fridge
 */
export async function addFridgeItem(req: Request, res: Response) {
  const userId = (req as any).userId;
  const { name, amount, unit, category } = req.body;

  if (!name?.trim()) {
    res.status(400).json(badRequest('食材名称不能为空'));
    return;
  }

  try {
    // 检查是否已存在同名食材，存在则更新数量
    const existing = await prisma.fridgeItem.findFirst({
      where: { userId, name: name.trim() },
    });

    let item;
    if (existing) {
      // 累加数量
      const existingQty = parseFloat(existing.amount || '1') || 1;
      const addQty = parseFloat(amount || '1') || 1;
      item = await prisma.fridgeItem.update({
        where: { id: existing.id },
        data: {
          amount: String(existingQty + addQty),
          unit: unit || existing.unit,
          category: category || existing.category,
        },
      });
    } else {
      item = await prisma.fridgeItem.create({
        data: {
          userId,
          name: name.trim(),
          amount: amount || '1',
          unit: unit || null,
          category: category || 'other',
        },
      });
    }

    res.json(success({
      id: String(item.id),
      name: item.name,
      amount: item.amount || '',
      unit: item.unit || '',
      category: item.category || 'other',
      addedAt: item.addedAt.getTime(),
    }, existing ? '已累加数量' : '添加成功'));
  } catch (error) {
    console.error('[Fridge] 添加冰箱食材失败:', error);
    res.status(500).json(badRequest('添加失败'));
  }
}

/**
 * 批量添加食材到冰箱
 * POST /v1/app/fridge/batch
 */
export async function addFridgeItemsBatch(req: Request, res: Response) {
  const userId = (req as any).userId;
  const { items } = req.body as { items: Array<{ name: string; amount?: string; unit?: string; category?: string }> };

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json(badRequest('食材列表不能为空'));
    return;
  }

  try {
    const results = [];
    for (const ing of items) {
      if (!ing.name?.trim()) continue;

      const existing = await prisma.fridgeItem.findFirst({
        where: { userId, name: ing.name.trim() },
      });

      let item;
      if (existing) {
        const existingQty = parseFloat(existing.amount || '1') || 1;
        const addQty = parseFloat(ing.amount || '1') || 1;
        item = await prisma.fridgeItem.update({
          where: { id: existing.id },
          data: {
            amount: String(existingQty + addQty),
            unit: ing.unit || existing.unit,
            category: ing.category || existing.category,
          },
        });
      } else {
        item = await prisma.fridgeItem.create({
          data: {
            userId,
            name: ing.name.trim(),
            amount: ing.amount || '1',
            unit: ing.unit || null,
            category: ing.category || 'other',
          },
        });
      }
      results.push({
        id: String(item.id),
        name: item.name,
        amount: item.amount || '',
        unit: item.unit || '',
        category: item.category || 'other',
      });
    }

    res.json(success(results, `已添加 ${results.length} 种食材`));
  } catch (error) {
    console.error('[Fridge] 批量添加冰箱食材失败:', error);
    res.status(500).json(badRequest('批量添加失败'));
  }
}

/**
 * 更新冰箱食材
 * PUT /v1/app/fridge/:id
 */
export async function updateFridgeItem(req: Request, res: Response) {
  const userId = (req as any).userId;
  const id = parseInt(req.params.id);
  const { name, amount, unit, category } = req.body;

  if (isNaN(id)) {
    res.status(400).json(badRequest('无效的食材 ID'));
    return;
  }

  try {
    const existing = await prisma.fridgeItem.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      res.status(404).json(notFound('食材不存在'));
      return;
    }

    const updated = await prisma.fridgeItem.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(amount !== undefined && { amount }),
        ...(unit !== undefined && { unit }),
        ...(category !== undefined && { category }),
      },
    });

    res.json(success({
      id: String(updated.id),
      name: updated.name,
      amount: updated.amount || '',
      unit: updated.unit || '',
      category: updated.category || 'other',
      addedAt: updated.addedAt.getTime(),
    }, '更新成功'));
  } catch (error) {
    console.error('[Fridge] 更新冰箱食材失败:', error);
    res.status(500).json(badRequest('更新失败'));
  }
}

/**
 * 删除冰箱食材
 * DELETE /v1/app/fridge/:id
 */
export async function deleteFridgeItem(req: Request, res: Response) {
  const userId = (req as any).userId;
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    res.status(400).json(badRequest('无效的食材 ID'));
    return;
  }

  try {
    const existing = await prisma.fridgeItem.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      res.status(404).json(notFound('食材不存在'));
      return;
    }

    await prisma.fridgeItem.delete({ where: { id } });
    res.json(success(null, '删除成功'));
  } catch (error) {
    console.error('[Fridge] 删除冰箱食材失败:', error);
    res.status(500).json(badRequest('删除失败'));
  }
}

/**
 * 清空冰箱
 * DELETE /v1/app/fridge
 */
export async function clearFridge(req: Request, res: Response) {
  const userId = (req as any).userId;

  try {
    await prisma.fridgeItem.deleteMany({ where: { userId } });
    res.json(success(null, '已清空'));
  } catch (error) {
    console.error('[Fridge] 清空冰箱失败:', error);
    res.status(500).json(badRequest('清空失败'));
  }
}
