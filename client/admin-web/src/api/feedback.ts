import request from './request';
import type { AxiosPromise } from 'axios';

export interface FeedbackItem {
  id: number;
  feedbackId: string;
  userIdentifier: string | null;
  userType: 'user';
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

export type FeedbackType = 'bug' | 'suggest' | 'error' | 'other';
export type FeedbackStatus = 'pending' | 'processing' | 'resolved' | 'rejected';

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

export const feedbackApi = {
  // 获取反馈列表
  getFeedbacks(params: GetFeedbacksParams): AxiosPromise<{
    data: FeedbackItem[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    return request.get('/feedbacks', { params });
  },

  // 获取单个反馈详情
  getFeedbackById(id: number): AxiosPromise<{
    data: FeedbackItem;
  }> {
    return request.get(`/feedbacks/${id}`);
  },

  // 回复反馈
  replyFeedback(id: number, data: ReplyFeedbackDto): AxiosPromise<{
    data: ReplyItem;
  }> {
    return request.post(`/feedbacks/${id}/reply`, data);
  },

  // 更新反馈状态
  updateFeedbackStatus(id: number, status: FeedbackStatus): AxiosPromise {
    return request.patch(`/feedbacks/${id}/status`, { status });
  },

  // 删除反馈
  deleteFeedback(id: number): AxiosPromise {
    return request.delete(`/feedbacks/${id}`);
  },
};

// 反馈类型映射
export const FEEDBACK_TYPE_MAP: Record<FeedbackType, string> = {
  bug: 'Bug反馈',
  suggest: '功能建议',
  error: '内容纠错',
  other: '其他问题',
};

// 反馈状态映射
export const FEEDBACK_STATUS_MAP: Record<FeedbackStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
  rejected: '已驳回',
};
