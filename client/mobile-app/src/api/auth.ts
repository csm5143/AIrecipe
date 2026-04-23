/**
 * 认证相关 API
 */
import { post, get } from './request';
import type { LoginDto, LoginResponse, RegisterDto, User } from '@/types';

// 登录
export function login(data: LoginDto) {
  return post<ApiResponse<LoginResponse>>('/auth/login', { data });
}

// 注册
export function register(data: RegisterDto) {
  return post<ApiResponse<LoginResponse>>('/auth/register', { data });
}

// 发送验证码
export function sendVerifyCode(phone: string) {
  return post<ApiResponse<{ codeId: string }>>('/auth/send-code', { data: { phone } });
}

// 获取用户信息
export function getUserProfile() {
  return get<ApiResponse<User>>('/auth/profile');
}

// 更新用户信息
export function updateProfile(data: Partial<User>) {
  return patch<ApiResponse<User>>('/auth/profile', { data });
}

// 退出登录
export function logout() {
  return post<ApiResponse<null>>('/auth/logout');
}

// 刷新 Token
export function refreshToken(refreshToken: string) {
  return post<ApiResponse<LoginResponse>>('/auth/refresh', { data: { refreshToken } });
}
