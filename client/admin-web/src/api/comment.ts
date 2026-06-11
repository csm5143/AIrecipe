import request from './request';

export interface AdminComment {
  id: number;
  recipeId: number;
  userId: number;
  parentId: number | null;
  content: string;
  likeCount: number;
  replyCount: number;
  createdAt: number;
  updatedAt: number;
  user: { id: number; nickname: string; avatar: string; phone?: string };
  recipe: { id: number; title: string; coverImage: string; authorName?: string };
  parent?: {
    id: number;
    content: string;
    user: { id: number; nickname: string; avatar: string };
  } | null;
  replies?: AdminComment[];
}

export interface CommentListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  recipeId?: number;
  recipeKeyword?: string;
  userKeyword?: string;
  parentType?: '' | 'root' | 'reply';
  startDate?: string;
  endDate?: string;
}

export interface CommentRecipeOption {
  id: number;
  title: string;
  coverImage: string;
  authorName: string;
  commentCount: number;
}

export const commentApi = {
  list: (params: CommentListParams) =>
    request.get<{ list: AdminComment[]; total: number; page: number; pageSize: number }>('/comments', { params }),

  detail: (id: number) =>
    request.get<AdminComment>(`/comments/${id}`),

  create: (data: { recipeId: number; userId: number; content: string; parentId?: number }) =>
    request.post<AdminComment>('/comments', data),

  update: (id: number, data: { content: string }) =>
    request.put<AdminComment>(`/comments/${id}`, data),

  delete: (id: number) =>
    request.delete(`/comments/${id}`),

  recipeOptions: (keyword?: string) =>
    request.get<CommentRecipeOption[]>('/comments/recipe-options', { params: { keyword } }),
};
