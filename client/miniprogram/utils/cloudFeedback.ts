/**
 * 问题反馈 API - 对接后端 /v1/wx/app/feedback
 * 完整内嵌：不需要引用 httpApi/feedback，避免子包跨包依赖
 */
import { get, post } from './httpApi/request.js';

export const FEEDBACK_TYPE_MAP = {
  bug: 'BUG',
  suggest: 'SUGGEST',
  error: 'ERROR',
  other: 'OTHER',
} as const;

export type FeedbackType = keyof typeof FEEDBACK_TYPE_MAP;

export interface FeedbackSubmitParams {
  type: FeedbackType;
  typeLabel: string;
  content: string;
  contact: string;
  images: string[];
}

export async function submitFeedbackToCloud(params: FeedbackSubmitParams): Promise<{ success: boolean; message?: string; data?: any }> {
  try {
    const res = await post<{ feedbackId: number }>('/v1/wx/app/feedback', {
      type: params.type,
      content: params.content,
      contact: params.contact,
      images: params.images,
    });
    return { success: res.success, message: res.message, data: res.data };
  } catch (e) {
    console.error('[cloudFeedback] 提交失败', e);
    return { success: false, message: '提交失败' };
  }
}
