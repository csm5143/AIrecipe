import { Request, Response } from 'express';
import { prisma } from '../../../lib/prisma';
import { paginated } from '../../../types/response';

function asArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function stepImageUrls(steps: unknown): string[] {
  return asArray(steps)
    .map((item: any) => item?.image || item?.imageUrl || item?.image_url || '')
    .map((url) => String(url || '').trim())
    .filter(Boolean);
}

function isPostLikeRecipe(item: any) {
  const ingredients = asArray(item.ingredients);
  const steps = asArray(item.steps);
  return item.source === 'USER' && ingredients.length === 0 && steps.length > 0;
}

function mapFollowingFeedItem(item: any) {
  const imageUrls = stepImageUrls(item.steps);
  const createdAt = item.publishedAt || item.createdAt || item.updatedAt || new Date();
  const base = {
    id: item.id,
    createdAt: createdAt.getTime(),
    authorId: item.authorId,
    authorName: item.authorName || 'Food lover',
    authorAvatar: item.authorAvatar || '',
  };

  if (isPostLikeRecipe(item)) {
    return {
      type: 'post',
      ...base,
      content: item.description || item.title || '',
      imageUrl: item.coverImage || imageUrls[0] || '',
      imageUrls,
      likes: item.favoriteCount || 0,
      comments: item.commentCount || 0,
      favorites: item.collectCount || 0,
      timeAgo: '',
    };
  }

  return {
    type: 'recipe',
    ...base,
    title: item.title,
    coverImage: item.coverImage || '',
    description: item.description || '',
    difficulty: item.difficulty?.toLowerCase() || 'normal',
    cookingTime: item.cookingTime || 0,
    collectCount: item.collectCount || 0,
    likes: item.favoriteCount || 0,
  };
}

export async function getFollowingFeed(req: Request, res: Response) {
  const userId = (req as any).userId;
  const page = parseInt((req.body?.page ?? req.query.page) as string) || 1;
  const pageSize = Math.min(parseInt((req.body?.pageSize ?? req.query.pageSize) as string) || 20, 50);

  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  const followingIds = following.map((item) => item.followingId);

  if (followingIds.length === 0) {
    res.json(paginated([], { page, pageSize, total: 0 }));
    return;
  }

  const where = {
    source: 'USER',
    authorId: { in: followingIds },
    status: 'PUBLISHED',
    isDeleted: false,
  } as any;

  const [items, total] = await Promise.all([
    prisma.recipe.findMany({
      where,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.recipe.count({ where }),
  ]);

  res.json(paginated(items.map(mapFollowingFeedItem), { page, pageSize, total }));
}
