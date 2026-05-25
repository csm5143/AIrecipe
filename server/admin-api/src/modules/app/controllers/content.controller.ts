import { Request, Response } from 'express';
import { prisma } from '../../../lib/prisma';
import { success } from '../../../types/response';
import { Prisma } from '@prisma/client';

export async function getBanners(req: Request, res: Response) {
  try {
    const now = new Date();

    const banners = await prisma.banner.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { startTime: null, endTime: null },
          {
            startTime: { lte: now },
            endTime: { gte: now },
          },
        ],
      },
      orderBy: { sortOrder: 'asc' },
    });

    const result = banners.map(banner => ({
      id: banner.id,
      title: banner.title,
      imageUrl: banner.imageUrl,
      linkType: banner.linkType.toLowerCase(),
      linkValue: banner.linkValue,
    }));

    res.json(success(result));
  } catch (error) {
    console.error('[Content] 获取轮播图失败:', error);
    res.json(success([]));
  }
}

export async function getNotices(req: Request, res: Response) {
  try {
    const now = new Date();

    const notices = await prisma.notice.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { publishedAt: null },
          { publishedAt: { lte: now } },
        ],
      },
      orderBy: { publishedAt: 'desc' },
      take: 10,
    });

    const result = notices.map(notice => ({
      id: notice.id,
      title: notice.title,
      content: notice.content,
      type: notice.type.toLowerCase(),
      publishedAt: notice.publishedAt,
    }));

    res.json(success(result));
  } catch (error) {
    console.error('[Content] 获取公告失败:', error);
    res.json(success([]));
  }
}

export async function getHomeData(req: Request, res: Response) {
  try {
    const now = new Date();

    const [banners, latestRecipes, categories] = await Promise.all([
      prisma.banner.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { startTime: null, endTime: null },
            { startTime: { lte: now }, endTime: { gte: now } },
          ],
        },
        orderBy: { sortOrder: 'asc' },
        take: 5,
      }),
      prisma.recipe.findMany({
        where: {
          isDeleted: false,
          status: 'PUBLISHED',
        },
        take: 10,
        orderBy: { publishedAt: 'desc' },
      }),
      prisma.recipe.groupBy({
        by: ['category'],
        where: {
          isDeleted: false,
          status: 'PUBLISHED',
          category: { not: null },
        },
        _count: true,
        orderBy: {
          _count: { category: 'desc' },
        },
        take: 8,
      }),
    ]);

    const bannerList = banners.map(banner => ({
      id: banner.id,
      title: banner.title,
      imageUrl: banner.imageUrl,
      linkType: banner.linkType.toLowerCase(),
      linkValue: banner.linkValue,
    }));

    const recipeList = latestRecipes.map(recipe => ({
      id: recipe.id,
      name: recipe.title,
      coverImage: recipe.coverImage,
      description: recipe.description,
      difficulty: recipe.difficulty?.toLowerCase() || 'normal',
      timeCost: recipe.cookingTime,
      calories: recipe.calories,
      category: recipe.category,
      tags: recipe.tags || [],
    }));

    const categoryList = categories
      .filter(c => c.category)
      .map(c => ({
        id: c.category,
        name: c.category,
        count: c._count,
      }));

    res.json(success({
      banners: bannerList,
      latestRecipes: recipeList,
      categories: categoryList,
    }));
  } catch (error) {
    console.error('[Content] 获取首页数据失败:', error);
    res.json(success({
      banners: [],
      latestRecipes: [],
      categories: [],
    }));
  }
}

export async function getCards(req: Request, res: Response) {
  try {
    const now = new Date();
    const platform = (req.query.platform as string) || null;

    const where: Prisma.BannerWhereInput = {
      status: 'ACTIVE',
      OR: [
        { startTime: null, endTime: null },
        { startTime: { lte: now }, endTime: { gte: now } },
      ],
    };

    if (platform) {
      where.platform = { in: [platform as any, 'ALL'] };
    }

    const cards = await prisma.banner.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });

    const result = cards.map(c => ({
      id: c.id,
      title: c.title,
      subtitle: c.subtitle,
      cover: c.imageUrl,
      navType: c.linkType.toLowerCase(),
      navValue: c.linkValue || '',
      sortOrder: c.sortOrder,
    }));

    res.json(success(result));
  } catch (error) {
    console.error('[Content] 获取卡片失败:', error);
    res.json(success([]));
  }
}

export async function getDailyRecommend(req: Request, res: Response) {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 18, 36);

    const [featured, hot, latest] = await Promise.all([
      prisma.recipe.findMany({
        where: { isFeatured: true, isDeleted: false, status: 'PUBLISHED' },
        take: limit,
        orderBy: { weight: 'desc' },
      }),
      prisma.recipe.findMany({
        where: { isHot: true, isDeleted: false, status: 'PUBLISHED', isFeatured: false },
        take: limit,
        orderBy: { collectCount: 'desc' },
      }),
      prisma.recipe.findMany({
        where: { isDeleted: false, status: 'PUBLISHED', isFeatured: false, isHot: false },
        orderBy: { publishedAt: 'desc' },
        take: limit * 2,
      }),
    ]);

    const seen = new Set<number>();
    const merged: any[] = [];
    for (const r of [...featured, ...hot, ...latest]) {
      if (!seen.has(r.id)) { seen.add(r.id); merged.push(r); }
    }
    const selected = merged.slice(0, limit);

    const sceneLabels = (r: any): string => {
      const tags: string[] = Array.isArray(r.tags) ? r.tags.map((t: string) => t.toLowerCase()) : [];
      if (tags.includes('diet') || tags.includes('fitness')) return '减脂';
      if (tags.includes('children') || tags.includes('kids')) return '儿童';
      if (tags.includes('home') || tags.includes('homestyle')) return '家常';
      if (tags.includes('new')) return '尝鲜';
      return '推荐';
    };

    const result = selected.map(r => ({
      id: r.id,
      name: r.title,
      coverImage: r.coverImage,
      description: r.description,
      difficulty: r.difficulty?.toLowerCase(),
      timeCost: r.cookingTime,
      calories: r.calories,
      tags: r.tags || [],
      dishTypes: r.dishTypes || [],
      mealTimes: r.mealTimes || [],
      sceneLabel: sceneLabels(r),
    }));

    res.json(success(result));
  } catch (error) {
    console.error('[Content] 每日推荐获取失败:', error);
    res.json(success([]));
  }
}
