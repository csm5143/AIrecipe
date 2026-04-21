import { Request, Response } from 'express';
import { paginated } from '../../../types/response';

export async function getIngredients(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  res.json(paginated([], { page, pageSize, total: 0 }));
}

export async function createIngredient(req: Request, res: Response) {
  res.json({ code: 200, message: '创建成功', data: { id: 1 }, timestamp: Date.now() });
}
