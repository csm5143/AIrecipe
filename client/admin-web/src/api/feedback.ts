import request from './request';

export interface FeedbackItem {
  id: number;
  feedbackId: string;
  userIdentifier: string | null;
  userType: 'user' | 'visitor' | 'guest';
  nickname?: string;
  avatar?: string;
  type: FeedbackType;
  typeLabel: string;
  content: string;
  contact: string;
  images: string[];
  cloudImageUrls: string[];
  createTime: number;
  status: FeedbackStatus;
  statusText: string;
  reply?: ReplyItem[];
  appVersion?: string;
  phoneModel?: string;
  systemInfo?: string;
}

export interface ReplyItem {
  id: number;
  adminId: number;
  adminName: string;
  content: string;
  createTime: number;
}

export type FeedbackType = 'bug_report' | 'feature_request' | 'content_issue' | 'improvement' | 'other';
export type FeedbackStatus = 'pending' | 'in_progress' | 'replied' | 'resolved' | 'closed';

export interface GetFeedbacksParams {
  page?: number;
  pageSize?: number;
  type?: FeedbackType;
  status?: FeedbackStatus;
  keyword?: string;
}

export interface ReplyFeedbackDto {
  content: string;
  action?: 'reply' | 'resolve';
}

export interface FeedbackListResponse {
  list: FeedbackItem[];
  total: number;
  page: number;
  pageSize: number;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export const feedbackApi = {
  getFeedbacks(params: GetFeedbacksParams) {
    return request.get<FeedbackListResponse>('/feedbacks', { params });
  },

  getFeedbackById(id: number) {
    return request.get<FeedbackItem>(`/feedbacks/${id}`);
  },

  replyFeedback(id: number, data: ReplyFeedbackDto) {
    return request.post<ReplyItem>(`/feedbacks/${id}/reply`, data);
  },

  updateFeedbackStatus(id: number, status: FeedbackStatus) {
    return request.patch(`/feedbacks/${id}/status`, { status });
  },

  deleteFeedback(id: number) {
    return request.delete(`/feedbacks/${id}`);
  },
};

// 反馈类型映射（key 与后端返回的 type 值一致）
export const FEEDBACK_TYPE_MAP: Record<FeedbackType, string> = {
  bug_report: 'Bug反馈',
  feature_request: '功能建议',
  content_issue: '内容纠错',
  improvement: '改进建议',
  other: '其他问题',
};

// 反馈状态映射（key 与后端返回的 status 值一致）
export const FEEDBACK_STATUS_MAP: Record<FeedbackStatus, string> = {
  pending: '待处理',
  in_progress: '处理中',
  replied: '已回复',
  resolved: '已解决',
  closed: '已关闭',
};
