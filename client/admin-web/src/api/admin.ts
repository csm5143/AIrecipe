import request from './request';

export interface Admin {
  id: number;
  username: string;
  nickname?: string;
  email?: string;
  avatar?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'AUDITOR';
  status: 'ACTIVE' | 'DISABLED' | 'BANNED';
  lastLoginAt?: string;
  lastLoginIp?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
}

export const adminApi = {
  list(params: AdminQuery = {}) {
    const { page = 1, pageSize = 20, keyword } = params;
    return request.get<any, any>('/admins', {
      params: { page, pageSize, keyword },
    });
  },

  getById(id: number) {
    return request.get<any, any>(`/admins/${id}`);
  },

  create(data: {
    username: string;
    password: string;
    nickname?: string;
    email?: string;
    role?: string;
    status?: string;
  }) {
    return request.post<any, any>('/admins', data);
  },

  update(id: number, data: {
    nickname?: string;
    email?: string;
    role?: string;
    status?: string;
    avatar?: string;
  }) {
    return request.put<any, any>(`/admins/${id}`, data);
  },

  resetPassword(id: number, newPassword: string) {
    return request.post<any, any>(`/admins/${id}/reset-password`, { newPassword });
  },

  delete(id: number) {
    return request.delete<any, any>(`/admins/${id}`);
  },

  restore(id: number) {
    return request.post<any, any>(`/admins/${id}/restore`);
  },

  forgotPassword(data: { username: string; email: string }) {
    return request.post<any, any>('/admin/auth/forgot-password', data);
  },

  resetPasswordByCode(data: {
    username: string;
    email: string;
    verifyCode: string;
    newPassword: string;
  }) {
    return request.post<any, any>('/admin/auth/reset-password', data);
  },
};
