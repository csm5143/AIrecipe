import { Request, Response } from 'express';
import { prisma } from '../../../lib/prisma';
import { success, paginated } from '../../../types/response';

export async function getAppIngredients(req: Request, res: Response) {
  const keyword = req.query.keyword as string;
  const category = req.query.category as string;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);

  const where: any = { status: 'ACTIVE' };
  if (keyword) {
    where.OR = [
      { name: { contains: keyword, mode: 'insensitive' } },
      { alias: { contains: keyword, mode: 'insensitive' } },
    ];
  }
  if (category) where.category = category;

  const [total, list] = await Promise.all([
    prisma.ingredient.count({ where }),
    prisma.ingredient.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  res.json(paginated(list, { page, pageSize, total }));
}
