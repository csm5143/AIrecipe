// 用户类型
export type Gender = 'MALE' | 'FEMALE' | 'UNKNOWN';
export type AccountStatus = 'ACTIVE' | 'DISABLED';

export interface User {
  id: number;
  openid?: string;
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

// 登录相关
export interface LoginDto {
  phone: string;
  code?: string;
  password?: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  expiresIn: string;
  user: User;
}

export interface RegisterDto {
  phone: string;
  code: string;
  nickname?: string;
}
