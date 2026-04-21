import { Request, Response } from 'express';
import { paginated } from '../../../types/response';

export async function getCollections(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  res.json(paginated([], { page, pageSize, total: 0 }));
}
