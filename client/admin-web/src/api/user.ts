import request from './request';

export interface UserRow {
  id: number;
  nickname: string;
  avatar: string;
  phone: string;
  gender: 'male' | 'female' | '';
  collectionCount: number;
  feedbackCount: number;
  fridgeCount?: number;
  aiScanCount?: number;
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
  lastLoginAt: string;
  bio?: string;
  userType?: string;
}

export const userApi = {
  list: (params: { page?: number; pageSize?: number; keyword?: string; gender?: string; status?: string }) =>
    request.get<{ list: UserRow[]; total: number }>('/users', { params }),

  detail: (id: number) =>
    request.get<any>(`/users/${id}`),

  update: (id: number, data: { nickname?: string; avatar?: string; gender?: string; bio?: string }) =>
    request.put<UserRow>(`/users/${id}`, data),

  updateStatus: (id: number, status: string) =>
    request.put(`/users/${id}/status`, { status }),

  delete: (id: number) =>
    request.delete(`/users/${id}`),

  create: (data: { nickname?: string; phone?: string; password?: string; gender?: string; avatar?: string; bio?: string }) =>
    request.post('/users', data),

  export: (params: { keyword?: string; gender?: string; status?: string }, format: 'csv' | 'xlsx') =>
    request.get('/users/export', { params: { ...params, format }, responseType: 'blob' }),

  addFridgeItem: (userId: number, data: { name: string; amount?: string; unit?: string }) =>
    request.post(`/users/${userId}/fridge`, data),

  deleteFridgeItem: (userId: number, fridgeId: number) =>
    request.delete(`/users/${userId}/fridge/${fridgeId}`),

  getShoppingLists: (userId: number) =>
    request.get(`/users/${userId}/shopping-lists`),
};
