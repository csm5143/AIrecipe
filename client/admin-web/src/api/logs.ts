import request from './request';

export interface LogItem {
  id: string;
  actorType: 'admin' | 'user';
  actorName: string;
  action: string;
  module: string;
  target: string;
  detail: string;
  ip: string;
  createdAt: string;
}

export interface EmailLogItem {
  id: number;
  toEmail: string;
  subject: string;
  type: string;
  status: 'sent' | 'failed';
  error?: string;
  createdAt: string;
}

export interface VerificationTokenItem {
  id: number;
  email?: string;
  phone?: string;
  type: string;
  attempts: number;
  usedAt?: string;
  expiresAt: string;
  createdAt: string;
}

export interface AiUsageLogItem {
  id: number;
  apiKeyId: number;
  apiKeyName: string;
  model: string;
  usage: string | null;
  purpose: string;
  tokensIn: number;
  tokensOut: number;
  totalTokens: number;
  cost: number;
  userId?: number;
  userName?: string;
  input?: string;
  output?: string;
  duration?: number;
  success: boolean;
  error?: string;
  createdAt: string;
}

export interface AiUsageSummaryItem {
  usage: string;
  label: string;
  count: number;
  successCount: number;
  failedCount: number;
  tokensIn: number;
  tokensOut: number;
  totalTokens: number;
  cost: number;
}

export const logsApi = {
  unified: (params: {
    type?: 'all' | 'admin' | 'user';
    page?: number;
    pageSize?: number;
    keyword?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }) => request.get<any>('/logs/unified', { params }),

  getEmailLogs: (params?: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    status?: string;
    type?: string;
  }) => request.get<any>('/logs/email-logs', { params }),

  getVerificationTokens: (params?: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    type?: string;
    used?: string;
  }) => request.get<any>('/logs/verification-tokens', { params }),

  aiUsage: (params?: {
    page?: number;
    pageSize?: number;
    usage?: string;
    success?: string;
    keyword?: string;
    userId?: number | string;
    startDate?: string;
    endDate?: string;
  }) => request.get<{
    list: AiUsageLogItem[];
    total: number;
    page: number;
    pageSize: number;
    summary: {
      total: Omit<AiUsageSummaryItem, 'usage' | 'label'>;
      byUsage: AiUsageSummaryItem[];
    };
  }>('/logs/ai-usage', { params }),
};
