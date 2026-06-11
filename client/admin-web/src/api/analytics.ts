import request from './request';

export interface WeeklyStats {
  labels: string[];
  userTrend: number[];
  recipeTrend: number[];
  commentTrend: number[];
  aiTrend: number[];
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
  totalComments: number;
  totalFollows: number;
  totalAiCalls: number;
  totalViews: number;
  todayNewUsers: number;
  auditStats: {
    pending: number;
    published: number;
    rejected: number;
  };
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
  topRecipes: Array<{
    id: number;
    title: string;
    coverImage: string | null;
    viewCount: number;
    favoriteCount: number;
    commentCount: number;
  }>;
  activeUsers: Array<{
    id: number;
    nickname: string;
    avatar: string;
    updatedAt: string;
    commentCount: number;
    followingCount: number;
    followerCount: number;
  }>;
}

export interface AiKeyTokenStat {
  model: string;
  name: string;
  totalTokens: number | null;
  usedTokens: number;
  remaining: number | null;
  isActive: boolean;
}

export interface AiTokenStatsResponse {
  keys: AiKeyTokenStat[];
  summary: {
    total: number;
    usedTokens: number;
    remaining: number;
  };
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

  getAiTokenStats: () =>
    request.get<AiTokenStatsResponse>('/analytics/ai-token-stats'),
};
