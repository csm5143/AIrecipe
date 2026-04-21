import { Request, Response } from 'express';
import { paginated } from '../../../types/response';
import { NotFoundException } from '../../system/middleware/errorHandler';

export async function getRecipes(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const { status, category, keyword } = req.query;

  // TODO: 使用 Prisma 查询食谱列表
  // const where: any = {};
  // if (status) where.status = status;
  // if (category) where.category = category;
  // if (keyword) where.OR = [{ title: { contains: keyword } }, { description: { contains: keyword } }];

  res.json(paginated([], { page, pageSize, total: 0 }));
}

export async function getRecipeById(req: Request, res: Response) {
  const { id } = req.params;
  res.json({ code: 200, message: 'success', data: null, timestamp: Date.now() });
}

export async function createRecipe(req: Request, res: Response) {
  res.json({ code: 200, message: '创建成功', data: { id: 1 }, timestamp: Date.now() });
}

export async function updateRecipe(req: Request, res: Response) {
  const { id } = req.params;
  res.json({ code: 200, message: '更新成功', timestamp: Date.now() });
}

export async function deleteRecipe(req: Request, res: Response) {
  const { id } = req.params;
  res.json({ code: 200, message: '删除成功', timestamp: Date.now() });
}

export async function batchDeleteRecipes(req: Request, res: Response) {
  const { ids } = req.body;
  res.json({ code: 200, message: `成功删除 ${ids?.length || 0} 条记录`, timestamp: Date.now() });
}
