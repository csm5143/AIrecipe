import { Request, Response } from 'express';
import { paginated } from '../../../types/response';

export async function getFeedbacks(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  res.json(paginated([], { page, pageSize, total: 0 }));
}

export async function replyFeedback(req: Request, res: Response) {
  const { id } = req.params;
  const { content } = req.body;
  res.json({ code: 200, message: '回复成功', timestamp: Date.now() });
}
