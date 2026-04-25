// ==================== 通用类型 ====================

export type Gender = 'MALE' | 'FEMALE' | 'UNKNOWN';

export type AccountStatus = 'ACTIVE' | 'DISABLED';

export type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'OFFLINE' | 'DELETED';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type FeedbackType = 'BUG_REPORT' | 'FEATURE_REQUEST' | 'CONTENT_ISSUE' | 'OTHER';

export type FeedbackStatus = 'PENDING' | 'REPLIED' | 'RESOLVED' | 'CLOSED';

// ==================== COS 存储类型 ====================

export type COSFolderType =
  | 'avatars'      // 用户头像
  | 'recipes'       // 菜谱图片
  | 'recipes/steps' // 菜谱步骤图
  | 'favorites'    // 收藏夹封面
  | 'feedback'     // 用户反馈
  | 'banners'      // Banner轮播图
  | 'categories'   // 分类图标
  | 'ingredients'  // 食材图片
  | 'tmp';         // 临时文件

export interface COSConfig {
  Bucket: string;
  Region: string;
  BaseUrl: string;
}

export interface COSUploadResult {
  url: string;
  key: string;
}

// ==================== 用户类型 ====================

export interface User {
  id: number;
  openid: string;
  unionid?: string;
  nickname?: string;
  avatar?: string;
  phone?: string;
  gender?: Gender;
  birthday?: string;
  status: AccountStatus;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: number;
  username: string;
  nickname?: string;
  avatar?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR';
  status: AccountStatus;
  lastLoginAt?: string;
  createdAt: string;
}

// ==================== 食谱类型 ====================

export interface Ingredient {
  id: number;
  name: string;
  alias?: string;
  coverImage?: string;
  category?: string;
  unit?: string;
  calories?: number;
  nutrition?: Record<string, number>;
  tags?: string[];
  status: ContentStatus;
  createdAt: string;
}

export interface RecipeIngredient {
  id?: number;
  name: string;
  amount: string;
  unit?: string;
  isOptional?: boolean;
}

export interface RecipeStep {
  order: number;
  content: string;
  image?: string;
  duration?: number;
}

export interface Nutrition {
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  fiber?: number;
  sodium?: number;
}

export interface Recipe {
  id: number;
  title: string;
  coverImage?: string;
  description?: string;
  difficulty: Difficulty;
  cookingTime?: number;
  servings?: number;
  calories?: number;
  tags?: string[];
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  tips?: string;
  nutrition?: Nutrition;
  cuisine?: string;
  category?: string;
  isAiGenerated: boolean;
  viewCount: number;
  collectCount: number;
  shareCount: number;
  status: ContentStatus;
  isFeatured: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== 收藏类型 ====================

export interface Collection {
  id: number;
  userId: number;
  name: string;
  description?: string;
  coverImage?: string;
  isPublic: boolean;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

// ==================== 反馈类型 ====================

export interface Feedback {
  id: number;
  userId?: number;
  user?: User;
  type: FeedbackType;
  content: string;
  images?: string[];
  contact?: string;
  status: FeedbackStatus;
  reply?: string;
  repliedAt?: string;
  repliedBy?: number;
  createdAt: string;
}

// ==================== API 响应 ====================

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
  timestamp: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginatedQuery {
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface SearchQuery extends PaginatedQuery {
  keyword?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

// ==================== 统计数据 ====================

export interface DashboardStats {
  totalUsers: number;
  totalRecipes: number;
  totalCollections: number;
  totalFeedbacks: number;
  todayActiveUsers: number;
  todayNewUsers: number;
  weeklyStats: {
    date: string;
    users: number;
    recipes: number;
    collections: number;
  }[];
  recentFeedbacks: Feedback[];
}

// ==================== 登录相关 ====================

export interface LoginDto {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  expiresIn: string;
  admin: AdminUser;
}

export interface UpdateProfileDto {
  nickname?: string;
  phone?: string;
}

export interface ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
}

export interface UpdateAvatarDto {
  avatar: string;
}
