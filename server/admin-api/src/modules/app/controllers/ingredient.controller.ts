import { Request, Response } from 'express';
import { prisma } from '../../../lib/prisma';
import { success, paginated } from '../../../types/response';
import { cache } from '../../../lib/cache';
import { cacheKeys } from '../../../lib/cacheKeys';
import { stableQueryKey } from '../utils/appQuery';

export async function getAppIngredients(req: Request, res: Response) {
  const keyword = req.query.keyword as string;
  const category = req.query.category as string;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);
  const queryKey = stableQueryKey(req.query as Record<string, unknown>);

  const where: any = { status: 'ACTIVE' };
  if (keyword) {
    where.OR = [
      { name: { contains: keyword, mode: 'insensitive' } },
      { alias: { contains: keyword, mode: 'insensitive' } },
    ];
  }
  if (category) where.category = category;

  const result = await cache.getOrSet(
    cacheKeys.appIngredientsList(queryKey),
    300,
    async () => {
      const [total, list] = await Promise.all([
        prisma.ingredient.count({ where }),
        prisma.ingredient.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { name: 'asc' },
        }),
      ]);
      return { total, list };
    }
  );

  res.json(paginated(result.list, { page, pageSize, total: result.total }));
}
