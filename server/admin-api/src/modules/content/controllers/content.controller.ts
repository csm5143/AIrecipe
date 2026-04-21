import { Request, Response } from 'express';
import { paginated } from '../../../types/response';

export async function getBanners(req: Request, res: Response) {
  res.json(paginated([], { page: 1, pageSize: 20, total: 0 }));
}

export async function createBanner(req: Request, res: Response) {
  res.json({ code: 200, message: '创建成功', data: { id: 1 }, timestamp: Date.now() });
}

export async function updateBanner(req: Request, res: Response) {
  res.json({ code: 200, message: '更新成功', timestamp: Date.now() });
}

export async function deleteBanner(req: Request, res: Response) {
  res.json({ code: 200, message: '删除成功', timestamp: Date.now() });
}
