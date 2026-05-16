import { Request, Response } from 'express';
import { prisma } from '../../../lib/prisma';
import { success } from '../../../types/response';

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

    const [banners, featuredRecipes, latestRecipes, categories] = await Promise.all([
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
          isFeatured: true,
        },
        take: 10,
        orderBy: { publishedAt: 'desc' },
      }),
      // 精选菜谱不足时兜底：取最新发布的菜谱
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

    const recipeList = (featuredRecipes.length >= 3 ? featuredRecipes : latestRecipes).map(recipe => ({
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
      featuredRecipes: recipeList,
      categories: categoryList,
    }));
  } catch (error) {
    console.error('[Content] 获取首页数据失败:', error);
    res.json(success({
      banners: [],
      featuredRecipes: [],
      categories: [],
    }));
  }
}
