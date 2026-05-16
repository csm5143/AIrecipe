import request from './request';

export type LinkType = 'NONE' | 'RECIPE' | 'WEBVIEW' | 'CATEGORY';
export type BannerStatus = 'ACTIVE' | 'INACTIVE';
export type NoticeStatus = 'DRAFT' | 'PUBLISHED' | 'OFFLINE';
export type NoticeType = 'NORMAL' | 'IMPORTANT' | 'ACTIVITY';

export interface Banner {
  id: number;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkType: LinkType;
  linkValue?: string;
  sortOrder: number;
  status: BannerStatus;
  startTime?: string;
  endTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notice {
  id: number;
  title: string;
  content: string;
  type: NoticeType;
  target: string;
  status: NoticeStatus;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentListResponse<T> {
  list: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface BannerQuery {
  page?: number;
  pageSize?: number;
  status?: string;
}

export interface NoticeQuery {
  page?: number;
  pageSize?: number;
}

export const contentApi = {
  // ==================== Banner ====================

  getBanners(params: BannerQuery = {}) {
    const { page = 1, pageSize = 20, status } = params;
    return request.get<any, any>('/content/banners', {
      params: { page, pageSize, status },
    });
  },

  createBanner(data: {
    title: string;
    subtitle?: string;
    imageUrl: string;
    linkType?: LinkType;
    linkValue?: string;
    sortOrder?: number;
    status?: BannerStatus;
    startTime?: string;
    endTime?: string;
  }) {
    return request.post<any, any>('/content/banners', data);
  },

  updateBanner(id: number, data: Partial<{
    title: string;
    subtitle?: string;
    imageUrl: string;
    linkType: LinkType;
    linkValue?: string;
    sortOrder: number;
    status: BannerStatus;
    startTime?: string;
    endTime?: string;
  }>) {
    return request.put<any, any>(`/content/banners/${id}`, data);
  },

  deleteBanner(id: number) {
    return request.delete<any, any>(`/content/banners/${id}`);
  },

  // ==================== Notice ====================

  getNotices(params: NoticeQuery = {}) {
    const { page = 1, pageSize = 20 } = params;
    return request.get<any, any>('/content/notices', {
      params: { page, pageSize },
    });
  },

  getNoticeById(id: number) {
    return request.get<any, any>(`/content/notices/${id}`);
  },

  createNotice(data: {
    title: string;
    content: string;
    type?: NoticeType;
    status?: NoticeStatus;
    publishedAt?: string;
  }) {
    return request.post<any, any>('/content/notices', data);
  },

  updateNotice(id: number, data: Partial<{
    title: string;
    content: string;
    type: NoticeType;
    status: NoticeStatus;
    publishedAt?: string;
  }>) {
    return request.put<any, any>(`/content/notices/${id}`, data);
  },

  deleteNotice(id: number) {
    return request.delete<any, any>(`/content/notices/${id}`);
  },
};
