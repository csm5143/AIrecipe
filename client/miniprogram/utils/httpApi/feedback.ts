/**
 * 反馈 API - 对接后端 /v1/wx/app/*
 */

import { get, post } from './request.js';

export interface FeedbackItem {
  id: number;
  feedbackId: number;
  type: string;
  typeLabel?: string;
  content: string;
  contact?: string;
  images?: string[];
  cloudImageUrls?: string[];
  createTime: number;
  status: string;
  reply?: {
    adminName: string;
    content: string;
    createTime: number;
  }[];
}

/**
 * 提交反馈
 */
export async function submitFeedback(params: {
  type: string;
  typeLabel?: string;
  content: string;
  contact?: string;
  images?: string[];
}): Promise<{ success: boolean; message: string; feedbackId?: string }> {
  const res = await post<{ feedbackId: number }>('/v1/wx/app/feedback', params);
  return {
    success: res.success,
    message: res.message || (res.success ? '提交成功' : '提交失败'),
    feedbackId: res.data?.feedbackId?.toString(),
  };
}

/**
 * 获取我的反馈历史
 */
export async function getMyFeedbacks(
  page = 1,
  pageSize = 20
): Promise<{ success: boolean; data?: FeedbackItem[]; total?: number; hasMore?: boolean }> {
  const res = await get<FeedbackItem[]>('/v1/wx/app/my-feedback', { page, pageSize });
  return {
    success: res.success,
    data: res.data,
    total: res.total,
    hasMore: res.hasMore,
  };
}

/**
 * 获取单个反馈详情
 */
export async function getFeedbackDetail(id: number): Promise<{
  success: boolean; data?: FeedbackItem;
}> {
  const res = await get<FeedbackItem>(`/v1/wx/app/feedback/${id}`);
  return { success: res.success, data: res.data };
}
