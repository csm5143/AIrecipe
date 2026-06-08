import request from './request';
import type { LoginDto, LoginResponse, AdminUser, UpdateProfileDto, ChangePasswordDto } from '@airecipe/shared-types';

export const authApi = {
  login: (data: LoginDto) =>
    request.post<LoginResponse>('/auth/login', data),

  logout: () =>
    request.post('/auth/logout'),

  getProfile: () =>
    request.get<AdminUser>('/auth/profile'),

  refreshToken: (refreshToken: string) =>
    request.post<{ token: string; expiresIn: string }>('/auth/refresh-token', { refreshToken }),

  updateProfile: (data: UpdateProfileDto) =>
    request.put<AdminUser>('/auth/profile', data),

  changePassword: (data: ChangePasswordDto) =>
    request.put('/auth/password', data),

  updateAvatar: (data: { avatar: string }) =>
    request.put<{ avatar: string }>('/auth/avatar', data),
};
