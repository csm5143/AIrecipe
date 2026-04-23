/**
 * 内容运营相关 API
 */
import { get } from './request';

// 获取首页 Banner
export function getBanners() {
  return get<ApiResponse<{ id: number; image: string; link: string; title: string }[]>>('/content/banners');
}

// 获取公告列表
export function getAnnouncements() {
  return get<ApiResponse<{ id: number; title: string; content: string; publishedAt: string }[]>>(
    '/content/announcements'
  );
}
