import request from './request';

export type AdminNotificationType = 'SYSTEM' | 'ANNOUNCEMENT';

export interface AdminNotificationItem {
  id: number;
  type: AdminNotificationType;
  title: string;
  content: string;
  userId: number;
  receiverName: string;
  receiverAvatar: string;
  isRead: boolean;
  readAt: number | null;
  createdAt: number;
  data: Record<string, unknown>;
}

export interface AdminNotificationListResponse {
  list: AdminNotificationItem[];
  total: number;
  page: number;
  pageSize: number;
}

export const adminNotificationApi = {
  getNotifications(params: {
    page?: number;
    pageSize?: number;
    type?: AdminNotificationType | '';
    userId?: number | '';
  }) {
    return request.get<AdminNotificationListResponse>('/admin/notifications', { params });
  },

  sendNotification(data: {
    type: AdminNotificationType;
    title: string;
    content: string;
    userIds?: number[];
  }) {
    return request.post<{ count: number }>('/admin/notifications/send', data);
  },

  deleteNotification(id: number) {
    return request.delete(`/admin/notifications/${id}`);
  },
};
