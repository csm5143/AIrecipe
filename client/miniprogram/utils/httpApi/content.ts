/**
 * 内容 API - 对接后端 /v1/app/content
 * 首页 banner、notice、home 数据
 */
import { get } from './request.js';

// ============ 类型定义 ============

export interface Banner {
  id: number;
  title: string;
  imageUrl: string;
  linkType: string;
  linkValue?: string;
  sortOrder: number;
  status: string;
  startTime?: string;
  endTime?: string;
}

export interface Notice {
  id: number;
  title: string;
  content: string;
  type: string;
  status: string;
  publishedAt?: string;
}

export interface HomeContent {
  banners: Banner[];
  notices: Notice[];
}

/**
 * 获取首页内容（banner + notice 合并请求）
 */
export async function getHomeContent(): Promise<{
  success: boolean; data?: HomeContent;
}> {
  const res = await get<HomeContent>('/v1/app/content/home');
  return { success: res.success, data: res.data };
}

/**
 * 获取 Banner 列表
 */
export async function getBanners(): Promise<{
  success: boolean; data?: Banner[];
}> {
  const res = await get<Banner[]>('/v1/app/content/banners');
  return { success: res.success, data: res.data };
}

/**
 * 获取公告列表
 */
export async function getNotices(): Promise<{
  success: boolean; data?: Notice[];
}> {
  const res = await get<Notice[]>('/v1/app/content/notices');
  return { success: res.success, data: res.data };
}
