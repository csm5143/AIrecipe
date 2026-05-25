import { Request, Response } from 'express';
import { success } from '../../../types/response';
import { prisma } from '../../../lib/prisma';
import { subDays, startOfDay, endOfDay } from '../utils/date';

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
    recentFeedbacks,
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
    prisma.feedback.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { nickname: true, avatar: true } } },
    }),
  ]);

  // 统计每周用户/菜谱趋势（最近7天）
  const userTrend: Record<string, number> = {};
  const recipeTrend: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = subDays(today, i);
    const key = `${d.getMonth() + 1}月${d.getDate()}日`;
    userTrend[key] = 0;
    recipeTrend[key] = 0;
  }
  weeklyUsers.forEach(u => {
    const d = u.createdAt;
    const key = `${d.getMonth() + 1}月${d.getDate()}日`;
    if (key in userTrend) userTrend[key] += u._count;
  });
  weeklyRecipes.forEach(r => {
    const d = r.createdAt;
    const key = `${d.getMonth() + 1}月${d.getDate()}日`;
    if (key in recipeTrend) recipeTrend[key] += r._count;
  });

  const labels = Object.keys(userTrend);
  const weeklyStats = {
    labels,
    userTrend: Object.values(userTrend),
    recipeTrend: Object.values(recipeTrend),
  };

  const FEEDBACK_TYPE_MAP: Record<string, string> = {
    BUG_REPORT: 'Bug反馈', FEATURE_REQUEST: '功能建议', CONTENT_ISSUE: '内容纠错', IMPROVEMENT: '改进建议', OTHER: '其他问题',
  };
  const FEEDBACK_STATUS_MAP: Record<string, string> = {
    PENDING: '待处理', IN_PROGRESS: '处理中', REPLIED: '已回复', RESOLVED: '已解决', CLOSED: '已关闭',
  };

  const feedbackList = recentFeedbacks.map(f => ({
    id: f.id,
    content: f.content,
    type: f.type.toLowerCase(),
    typeText: FEEDBACK_TYPE_MAP[f.type] || f.type,
    status: f.status.toLowerCase(),
    statusText: FEEDBACK_STATUS_MAP[f.status] || f.status,
    createdAt: f.createdAt.toISOString().slice(0, 16).replace('T', ' '),
    nickname: f.user?.nickname || '匿名用户',
    avatar: f.user?.avatar || '',
  }));

  const result = { totalUsers, totalRecipes, totalCollections, totalFeedbacks, todayNewUsers, weeklyStats, recentFeedbacks: feedbackList };
  res.json(success(result));
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

  const labels: string[] = [];
  const dataMap: Record<string, number> = {};
  for (let i = daysAgo; i >= 0; i--) {
    const d = subDays(now, i);
    const key = `${d.getMonth() + 1}/${d.getDate()}`;
    labels.push(key);
    dataMap[key] = 0;
  }

  dailyUsers.forEach(u => {
    const d = new Date(u.createdAt);
    const key = `${d.getMonth() + 1}/${d.getDate()}`;
    if (key in dataMap) dataMap[key] += u._count.id;
  });

  res.json(success({ labels, datasets: [{ label: '用户增长', data: labels.map(l => dataMap[l]) }] }));
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

  const labels: string[] = [];
  const dataMap: Record<string, number> = {};
  for (let i = daysAgo; i >= 0; i--) {
    const d = subDays(now, i);
    const key = `${d.getMonth() + 1}/${d.getDate()}`;
    labels.push(key);
    dataMap[key] = 0;
  }

  dailyRecipes.forEach(r => {
    const d = new Date(r.createdAt);
    const key = `${d.getMonth() + 1}/${d.getDate()}`;
    if (key in dataMap) dataMap[key] += r._count.id;
  });

  res.json(success({ labels, datasets: [{ label: '菜谱发布', data: labels.map(l => dataMap[l]) }] }));
}

export async function getFeedbackStats(req: Request, res: Response) {
  const [pending, inProgress, resolved, closed] = await Promise.all([
    prisma.feedback.count({ where: { status: 'PENDING' } }),
    prisma.feedback.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.feedback.count({ where: { status: 'RESOLVED' } }),
    prisma.feedback.count({ where: { status: 'CLOSED' } }),
  ]);
  res.json(success({
    labels: ['待处理', '处理中', '已解决', '已关闭'],
    datasets: [{ label: '反馈状态', data: [pending, inProgress, resolved, closed] }],
  }));
}

export async function getRecipeCategoryStats(req: Request, res: Response) {
  const recipes = await prisma.recipe.findMany({
    where: { isDeleted: false },
    select: { dishTypes: true, category: true },
  });

  const COLOR_PALETTE = [
    '#f54e00', '#1f8a65', '#4a7dbf', '#d4880e',
    '#9b59b6', '#e67e22', '#2ecc71', '#e74c3c',
  ];

  const map: Record<string, string> = {
    staple: '主食', stir_fry: '小炒菜', soup: '汤品', boiled: '煮食',
    fried: '炒食', cold: '凉菜', porridge: '粥', noodles: '面食',
    dessert: '甜品', drink: '饮品', braised: '卤味', bbq: '烧烤',
    hotpot: '火锅', deep_fried: '油炸', baked: '烘焙', sashimi: '刺身',
    western: '西餐', diet: '减脂餐', children: '儿童餐',
  };

  const counts: Record<string, number> = {};
  for (const r of recipes) {
    // dishTypes 有值则用 dishTypes，否则 fallback 到 category
    const types: string[] = Array.isArray(r.dishTypes) && r.dishTypes.length
      ? r.dishTypes as string[]
      : r.category ? [r.category]
      : [];
    for (const t of types) {
      const label = map[t] || t;
      counts[label] = (counts[label] || 0) + 1;
    }
  }

  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const data = sorted.map(([name, value], i) => ({
    name,
    value,
    itemStyle: { color: COLOR_PALETTE[i % COLOR_PALETTE.length] },
  }));

  res.json(success({ data }));
}

export async function getAiTokenStats(req: Request, res: Response) {
  const keys = await prisma.aiApiKey.findMany({
    orderBy: { createdAt: 'asc' },
  });

  const stats = keys.map(k => ({
    model: k.model,
    name: k.name,
    totalTokens: k.totalTokens,
    usedTokens: k.usedTokens,
    remaining: Math.max(0, k.totalTokens - k.usedTokens),
    isActive: k.isActive,
  }));

  const totalUsed = stats.reduce((sum, s) => sum + s.usedTokens, 0);
  const totalRemaining = stats.reduce((sum, s) => sum + s.remaining, 0);
  const total = stats.reduce((sum, s) => sum + s.totalTokens, 0);

  res.json(success({
    keys: stats,
    summary: { total, usedTokens: totalUsed, remaining: totalRemaining },
  }));
}
