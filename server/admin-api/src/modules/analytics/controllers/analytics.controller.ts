import { Request, Response } from 'express';

export async function getDashboardStats(req: Request, res: Response) {
  res.json({
    code: 200,
    message: 'success',
    data: {
      totalUsers: 0,
      totalRecipes: 0,
      totalCollections: 0,
      totalFeedbacks: 0,
      todayActiveUsers: 0,
      todayNewUsers: 0,
      weeklyStats: [],
      recentFeedbacks: [],
    },
    timestamp: Date.now(),
  });
}

export async function getUserStats(req: Request, res: Response) {
  res.json({
    code: 200,
    message: 'success',
    data: { labels: [], datasets: [] },
    timestamp: Date.now(),
  });
}

export async function getRecipeStats(req: Request, res: Response) {
  res.json({
    code: 200,
    message: 'success',
    data: { labels: [], datasets: [] },
    timestamp: Date.now(),
  });
}

export async function getFeedbackStats(req: Request, res: Response) {
  res.json({
    code: 200,
    message: 'success',
    data: { labels: [], datasets: [] },
    timestamp: Date.now(),
  });
}
