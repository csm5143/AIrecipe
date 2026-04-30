import request from './request';
import type { AxiosPromise } from 'axios';

/** 用户上传的菜谱 */
export interface UserRecipeItem {
  _id: string;
  recipeId: string;
  openid: string;
  nickname: string;
  avatar: string;
  
  // 菜谱内容
  title: string;
  coverImage: string;
  description: string;
  difficulty: 'easy' | 'normal' | 'hard';
  cookingTime: number;
  servings: number;
  
  ingredients: Array<{ name: string; amount: string }>;
  steps: Array<{ description: string; image?: string }>;
  tips?: string;
  
  tags: string[];
  mealTimes: string[];
  dishTypes: string[];
  
  // 审核状态
  status: 'pending' | 'approved' | 'rejected';
  rejectReason?: string;
  
  // 互动数据
  viewCount: number;
  likeCount: number;
  
  // 时间戳
  createdAt: number;
  updatedAt: number;
  publishedAt?: number;
  
  // 审核历史
  auditHistory?: AuditRecord[];
}

/** 审核记录 */
export interface AuditRecord {
  _id?: string;
  recipeId: string;
  action: 'approve' | 'reject';
  reason?: string;
  auditorName: string;
  createdAt: number;
}

/** 获取列表参数 */
export interface GetRecipesParams {
  page?: number;
  pageSize?: number;
  status?: 'pending' | 'approved' | 'rejected';
}

/** 审核操作 */
export interface AuditDto {
  action: 'approve' | 'reject';
  reason?: string;
  auditorName?: string;
}

export const recipeAuditApi = {
  // 获取待审核列表
  getPendingRecipes(params?: GetRecipesParams): AxiosPromise<{
    data: UserRecipeItem[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    return request.get('/recipe-audit/pending', { params });
  },

  // 获取已审核列表
  getProcessedRecipes(params?: GetRecipesParams): AxiosPromise<{
    data: UserRecipeItem[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    return request.get('/recipe-audit/processed', { params });
  },

  // 获取菜谱详情
  getRecipeDetail(recipeId: string): AxiosPromise<{
    data: UserRecipeItem;
  }> {
    return request.get(`/recipe-audit/${recipeId}`);
  },

  // 审核操作
  auditRecipe(recipeId: string, data: AuditDto): AxiosPromise {
    return request.post(`/recipe-audit/${recipeId}/review`, data);
  }
};
