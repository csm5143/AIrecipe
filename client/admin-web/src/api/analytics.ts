import request from './request';

export interface WeeklyStats {
  labels: string[];
  userTrend: number[];
  recipeTrend: number[];
}

export interface CategoryStatItem {
  name: string;
  value: number;
  itemStyle: { color: string };
}

export interface DashboardStats {
  totalUsers: number;
  totalRecipes: number;
  totalCollections: number;
  totalFeedbacks: number;
  todayNewUsers: number;
  weeklyStats: WeeklyStats;
  recentFeedbacks: Array<{
    id: number;
    content: string;
    type: string;
    typeText: string;
    status: string;
    statusText: string;
    createdAt: string;
    nickname: string;
    avatar: string;
  }>;
}

export interface DashboardStatsResponse {
  code: number;
  message: string;
  data: DashboardStats;
  timestamp: number;
}

export const analyticsApi = {
  dashboard: () =>
    request.get<DashboardStatsResponse>('/analytics/dashboard'),

  getCategoryStats: () =>
    request.get<{ data: CategoryStatItem[] }>('/analytics/category-stats'),
};
