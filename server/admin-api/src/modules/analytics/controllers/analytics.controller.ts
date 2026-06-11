import { Request, Response } from 'express';
import { success } from '../../../types/response';
import { prisma } from '../../../lib/prisma';
import { subDays, startOfDay, endOfDay } from '../utils/date';

function dayKey(date: Date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function emptyDailyMap(now: Date, days: number) {
  const labels: string[] = [];
  const map: Record<string, number> = {};
  for (let i = days - 1; i >= 0; i--) {
    const key = dayKey(subDays(now, i));
    labels.push(key);
    map[key] = 0;
  }
  return { labels, map };
}

export async function getDashboardStats(req: Request, res: Response) {
  const today = new Date();
  const weekAgo = subDays(today, 7);
  const [
    totalUsers,
    totalRecipes,
    totalCollections,
    totalFeedbacks,
    todayNewUsers,
    weeklyUsers,
    weeklyRecipes,
    weeklyComments,
    weeklyAiUsage,
    recentFeedbacks,
    viewAgg,
    totalComments,
    totalFollows,
    totalAiCalls,
    pendingWorks,
    publishedWorks,
    rejectedWorks,
    topRecipes,
    activeUsers,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.recipe.count({ where: { isDeleted: false } }),
    prisma.collection.count(),
    prisma.feedback.count(),
    prisma.user.count({
      where: { deletedAt: null, createdAt: { gte: startOfDay(today), lte: endOfDay(today) } },
    }),
    prisma.user.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: weekAgo }, deletedAt: null },
      _count: true,
    }),
    prisma.recipe.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: weekAgo }, isDeleted: false },
      _count: true,
    }),
    prisma.comment.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: weekAgo } },
      _count: true,
    }),
    prisma.aiUsageLog.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: weekAgo } },
      _count: true,
    }),
    prisma.feedback.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { nickname: true, avatar: true } } },
    }),
    prisma.recipe.aggregate({ _sum: { viewCount: true } }),
    prisma.comment.count(),
    prisma.follow.count(),
    prisma.aiUsageLog.count(),
    prisma.recipe.count({ where: { source: 'USER', status: 'PENDING', isDeleted: false } }),
    prisma.recipe.count({ where: { source: 'USER', status: 'PUBLISHED', isDeleted: false } }),
    prisma.recipe.count({ where: { source: 'USER', status: 'REJECTED', isDeleted: false } }),
    prisma.recipe.findMany({
      where: { isDeleted: false },
      orderBy: [{ viewCount: 'desc' }, { favoriteCount: 'desc' }],
      take: 8,
      select: { id: true, title: true, coverImage: true, viewCount: true, favoriteCount: true, commentCount: true },
    }),
    prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: 8,
      select: {
        id: true,
        nickname: true,
        avatar: true,
        updatedAt: true,
        _count: { select: { comments: true, following: true, followers: true } },
      },
    }),
  ]);

  const daily = emptyDailyMap(today, 7);
  const userTrend = { ...daily.map };
  const recipeTrend = { ...daily.map };
  const commentTrend = { ...daily.map };
  const aiTrend = { ...daily.map };

  weeklyUsers.forEach(item => {
    const key = dayKey(item.createdAt);
    if (key in userTrend) userTrend[key] += item._count;
  });
  weeklyRecipes.forEach(item => {
    const key = dayKey(item.createdAt);
    if (key in recipeTrend) recipeTrend[key] += item._count;
  });
  weeklyComments.forEach(item => {
    const key = dayKey(item.createdAt);
    if (key in commentTrend) commentTrend[key] += item._count;
  });
  weeklyAiUsage.forEach(item => {
    const key = dayKey(item.createdAt);
    if (key in aiTrend) aiTrend[key] += item._count;
  });

  const feedbackTypeMap: Record<string, string> = {
    BUG_REPORT: 'Bug feedback',
    FEATURE_REQUEST: 'Feature request',
    CONTENT_ISSUE: 'Content issue',
    IMPROVEMENT: 'Improvement',
    OTHER: 'Other',
  };
  const feedbackStatusMap: Record<string, string> = {
    PENDING: 'Pending',
    IN_PROGRESS: 'In progress',
    REPLIED: 'Replied',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed',
  };

  res.json(success({
    totalUsers,
    totalRecipes,
    totalCollections,
    totalFeedbacks,
    totalComments,
    totalFollows,
    totalAiCalls,
    todayNewUsers,
    totalViews: viewAgg._sum.viewCount ?? 0,
    auditStats: { pending: pendingWorks, published: publishedWorks, rejected: rejectedWorks },
    weeklyStats: {
      labels: daily.labels,
      userTrend: daily.labels.map(key => userTrend[key]),
      recipeTrend: daily.labels.map(key => recipeTrend[key]),
      commentTrend: daily.labels.map(key => commentTrend[key]),
      aiTrend: daily.labels.map(key => aiTrend[key]),
    },
    recentFeedbacks: recentFeedbacks.map(item => ({
      id: item.id,
      content: item.content,
      type: item.type.toLowerCase(),
      typeText: feedbackTypeMap[item.type] || item.type,
      status: item.status.toLowerCase(),
      statusText: feedbackStatusMap[item.status] || item.status,
      createdAt: item.createdAt.toISOString().slice(0, 16).replace('T', ' '),
      nickname: item.user?.nickname || 'Anonymous',
      avatar: item.user?.avatar || '',
    })),
    topRecipes,
    activeUsers: activeUsers.map(item => ({
      id: item.id,
      nickname: item.nickname || '',
      avatar: item.avatar || '',
      updatedAt: item.updatedAt.toISOString().slice(0, 16).replace('T', ' '),
      commentCount: item._count.comments,
      followingCount: item._count.following,
      followerCount: item._count.followers,
    })),
  }));
}

export async function getUserStats(req: Request, res: Response) {
  const now = new Date();
  const daysAgo = parseInt(req.query.days as string) || 30;
  const start = subDays(now, daysAgo);
  const dailyUsers = await prisma.user.groupBy({
    by: ['createdAt'],
    where: { createdAt: { gte: start }, deletedAt: null },
    _count: { id: true },
  });

  const { labels, map } = emptyDailyMap(now, daysAgo + 1);
  dailyUsers.forEach(item => {
    const key = dayKey(item.createdAt);
    if (key in map) map[key] += item._count.id;
  });

  res.json(success({ labels, datasets: [{ label: 'Users', data: labels.map(label => map[label]) }] }));
}

export async function getRecipeStats(req: Request, res: Response) {
  const now = new Date();
  const daysAgo = parseInt(req.query.days as string) || 30;
  const start = subDays(now, daysAgo);
  const dailyRecipes = await prisma.recipe.groupBy({
    by: ['createdAt'],
    where: { createdAt: { gte: start }, isDeleted: false },
    _count: { id: true },
  });

  const { labels, map } = emptyDailyMap(now, daysAgo + 1);
  dailyRecipes.forEach(item => {
    const key = dayKey(item.createdAt);
    if (key in map) map[key] += item._count.id;
  });

  res.json(success({ labels, datasets: [{ label: 'Recipes', data: labels.map(label => map[label]) }] }));
}

export async function getFeedbackStats(req: Request, res: Response) {
  const [pending, inProgress, resolved, closed] = await Promise.all([
    prisma.feedback.count({ where: { status: 'PENDING' } }),
    prisma.feedback.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.feedback.count({ where: { status: 'RESOLVED' } }),
    prisma.feedback.count({ where: { status: 'CLOSED' } }),
  ]);
  res.json(success({
    labels: ['Pending', 'In progress', 'Resolved', 'Closed'],
    datasets: [{ label: 'Feedback status', data: [pending, inProgress, resolved, closed] }],
  }));
}

export async function getRecipeCategoryStats(req: Request, res: Response) {
  const recipes = await prisma.recipe.findMany({
    where: { isDeleted: false },
    select: { dishTypes: true, category: true },
  });

  const colorPalette = [
    '#f54e00', '#1f8a65', '#4a7dbf', '#d4880e',
    '#9b59b6', '#e67e22', '#2ecc71', '#e74c3c',
  ];
  const labels: Record<string, string> = {
    staple: 'Staple',
    stir_fry: 'Stir fry',
    soup: 'Soup',
    boiled: 'Boiled',
    fried: 'Fried',
    cold: 'Cold dish',
    porridge: 'Porridge',
    noodles: 'Noodles',
    dessert: 'Dessert',
    drink: 'Drink',
    braised: 'Braised',
    bbq: 'BBQ',
    hotpot: 'Hotpot',
    deep_fried: 'Deep fried',
    baked: 'Baked',
    sashimi: 'Sashimi',
    western: 'Western',
    diet: 'Diet',
    children: 'Children',
  };

  const counts: Record<string, number> = {};
  for (const recipe of recipes) {
    const types = Array.isArray(recipe.dishTypes) && recipe.dishTypes.length
      ? recipe.dishTypes as string[]
      : recipe.category ? [recipe.category] : [];
    for (const type of types) {
      const label = labels[type] || type;
      counts[label] = (counts[label] || 0) + 1;
    }
  }

  const data = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value], index) => ({
      name,
      value,
      itemStyle: { color: colorPalette[index % colorPalette.length] },
    }));

  res.json(success({ data }));
}

export async function getAiTokenStats(req: Request, res: Response) {
  const keys = await prisma.aiApiKey.findMany({ orderBy: { createdAt: 'asc' } });
  const stats = keys.map(key => ({
    model: key.model,
    name: key.name,
    totalTokens: key.totalTokens,
    usedTokens: key.usedTokens,
    remaining: key.totalTokens === null ? null : Math.max(0, key.totalTokens - key.usedTokens),
    isActive: key.isActive,
  }));

  const totalUsed = stats.reduce((sum, item) => sum + item.usedTokens, 0);
  const totalRemaining = stats.reduce((sum, item) => sum + (item.remaining || 0), 0);
  const total = stats.reduce((sum, item) => sum + (item.totalTokens || 0), 0);

  res.json(success({
    keys: stats,
    summary: { total, usedTokens: totalUsed, remaining: totalRemaining },
  }));
}
