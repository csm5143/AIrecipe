import request from './request';

export type AiScanStatus = 'processing' | 'success' | 'failed';

export interface AiScanItem {
  id: number;
  userId: number;
  nickname: string;
  avatar: string;
  phone: string;
  imageUrl: string;
  result: Record<string, any>;
  recipes: any[];
  status: AiScanStatus;
  statusText: string;
  errorMsg: string;
  tokensUsed: number;
  apiKeyName: string;
  model: string;
  createTime: number;
}

export interface GetAiScansParams {
  page?: number;
  pageSize?: number;
  status?: AiScanStatus;
  keyword?: string;
  userId?: number;
}

export interface AiScanListResponse {
  list: AiScanItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const aiScanApi = {
  getList(params: GetAiScansParams = {}) {
    return request.get<AiScanListResponse>('/ai-scans', { params });
  },

  getById(id: number) {
    return request.get<AiScanItem>(`/ai-scans/${id}`);
  },

  updateStatus(id: number, status: AiScanStatus) {
    return request.patch(`/ai-scans/${id}/status`, { status });
  },

  delete(id: number) {
    return request.delete(`/ai-scans/${id}`);
  },
};

export const AI_SCAN_STATUS_MAP: Record<AiScanStatus, string> = {
  processing: '处理中',
  success: '已完成',
  failed: '失败',
};
