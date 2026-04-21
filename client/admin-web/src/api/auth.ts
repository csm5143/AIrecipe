import request from './request';
import type { ApiResponse, LoginDto, LoginResponse, AdminUser } from '@airecipe/shared-types';

export const authApi = {
  login: (data: LoginDto) =>
    request.post<ApiResponse<LoginResponse>>('/auth/login', data),

  logout: () =>
    request.post<ApiResponse>('/auth/logout'),

  getProfile: () =>
    request.get<ApiResponse<AdminUser>>('/auth/profile'),

  refreshToken: (refreshToken: string) =>
    request.post<ApiResponse<{ token: string; expiresIn: string }>>('/auth/refresh-token', { refreshToken }),
};
