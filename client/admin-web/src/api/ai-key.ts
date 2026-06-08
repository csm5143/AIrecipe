import request from './request';

export interface AiKeyItem {
  id: number;
  name: string;
  apiKey: string;       // masked: 前4后4
  baseUrl: string;
  model: string;
  keyType: string | null;  // 'image' | 'text' | 'multimodal' | null
  usage: string | null;    // 'chat' | 'vision' | 'image' | null
  totalTokens: number | null;
  usedTokens: number;
  remaining: number | null;
  pricePerMTok: number | null;
  cost: number | null;
  isActive: boolean;
  createdAt: string;
}

export const aiKeyApi = {
  getList: () => request.get<AiKeyItem[]>('/ai-keys'),

  create: (data: {
    name: string;
    apiKey: string;
    baseUrl: string;
    model: string;
    keyType?: string;
    usage?: string | null;
    totalTokens?: number | null;
    pricePerMTok?: number | null;
  }) => request.post('/ai-keys', data),

  update: (id: number, data: Partial<{
    name: string;
    apiKey: string;
    baseUrl: string;
    model: string;
    keyType: string;
    usage: string | null;
    totalTokens: number | null;
    pricePerMTok: number | null;
  }>) => request.put(`/ai-keys/${id}`, data),

  delete: (id: number) => request.delete(`/ai-keys/${id}`),

  activate: (id: number) => request.patch(`/ai-keys/${id}/activate`),

  test: (data: { apiKey: string; baseUrl: string; model: string }) =>
    request.post<{
      success: boolean;
      status?: number;
      error?: string;
      model?: string;
      response?: string;
      tokens?: number;
      elapsed?: number;
    }>('/ai-keys/test', data),
};
