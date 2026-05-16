import request from './request';

export interface RecycleItem {
  id: number;
  itemType: 'recipe' | 'user' | 'feedback' | 'ingredient';
  itemId: number;
  itemData: any;
  deletedBy: number;
  adminName: string;
  reason: string;
  createdAt: string;
  expiresAt: string | null;
}

export const recycleApi = {
  list: (params: { page?: number; pageSize?: number; itemType?: string; keyword?: string }) =>
    request.get<any>('/recycle-bin', { params }),

  restore: (id: number) =>
    request.post(`/recycle-bin/${id}/restore`),

  permanentDelete: (id: number) =>
    request.delete(`/recycle-bin/${id}/permanent`),
};
