/**
 * AI 扫描 API - 对接后端 /v1/app/ai-scans
 * 小程序拍照识别食材的扫描记录管理
 */
import { get, post } from './request';

// ============ 类型定义 ============

export interface AiScanResult {
  id: number;
  imageUrl: string;
  result: {
    ingredients: string[];
    model?: string;
    tokensUsed?: number;
  };
  recipes?: any[];
  status: 'PROCESSING' | 'SUCCESS' | 'FAILED';
  errorMsg?: string;
  tokensUsed?: number;
  model?: string;
  createdAt: string;
}

/**
 * 保存 AI 扫描记录
 */
export async function saveAiScan(params: {
  imageUrl: string;
  result: {
    ingredients: string[];
    model?: string;
    tokensUsed?: number;
  };
  recipes?: any[];
}): Promise<{ success: boolean; message: string; scanId?: number }> {
  const res = await post<{ id: number }>('/v1/app/ai-scans', params, { withToken: true });
  return {
    success: res.success,
    message: res.message || '',
    scanId: res.data?.id,
  };
}

/**
 * 获取我的 AI 扫描历史
 */
export async function getMyAiScans(params: {
  page?: number;
  pageSize?: number;
} = {}): Promise<{
  success: boolean; data?: AiScanResult[]; total?: number; hasMore?: boolean;
}> {
  const res = await get<AiScanResult[]>('/v1/app/ai-scans/my', params, { withToken: true });
  return { success: res.success, data: res.data, total: res.total, hasMore: res.hasMore };
}
