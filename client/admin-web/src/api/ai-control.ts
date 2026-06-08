import request from './request';

export interface AiControlDashboard {
  todayCalls: number;
  todayTokens: number;
  todayCost: number;
  successRate: number;
  averageDuration: number;
  activeSessions: number;
  activeSkills: number;
  pendingTasks: number;
}

export interface AiControlSettings {
  ai: {
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    contextMessages?: number;
    ragTopK?: number;
    memoryTopK?: number;
  };
  quota: {
    dailyLimit: number;
    dailyTokenLimit: number;
    whitelist: number[];
  };
}

export interface AiSkill {
  id: number;
  name: string;
  displayName: string;
  description?: string;
  triggerKeywords: string[];
  tools: string[];
  systemPrompt?: string;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AiSkillPayload {
  name?: string;
  displayName: string;
  description?: string;
  triggerKeywords: string[];
  tools: string[];
  systemPrompt?: string;
  priority: number;
  isActive: boolean;
}

export interface AiUserBrief {
  id: number;
  nickname?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface UserMemory {
  id: number;
  userId: number;
  type: string;
  content: string;
  metadata?: Record<string, unknown> | null;
  lastUsedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: AiUserBrief;
}

export interface ScheduledTask {
  id: number;
  userId: number;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  triggerAt: string;
  fired: boolean;
  firedAt?: string | null;
  createdAt: string;
  user?: AiUserBrief;
}

export interface PageResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const aiControlApi = {
  dashboard: () => request.get<AiControlDashboard>('/ai-control/dashboard'),
  getSettings: () => request.get<AiControlSettings>('/ai-control/settings'),
  saveSettings: (data: Partial<AiControlSettings>) => request.put('/ai-control/settings', data),

  getSkills: () => request.get<AiSkill[]>('/ai-control/skills'),
  createSkill: (data: AiSkillPayload) => request.post<AiSkill>('/ai-control/skills', data),
  updateSkill: (id: number, data: Partial<AiSkillPayload>) => request.put<AiSkill>(`/ai-control/skills/${id}`, data),
  toggleSkill: (id: number, isActive: boolean) => request.patch<AiSkill>(`/ai-control/skills/${id}/toggle`, { isActive }),
  deleteSkill: (id: number) => request.delete(`/ai-control/skills/${id}`),

  getMemories: (params?: { page?: number; pageSize?: number; userId?: number | string; type?: string }) =>
    request.get<PageResponse<UserMemory>>('/ai-control/memories', { params }),
  deleteMemory: (id: number) => request.delete(`/ai-control/memories/${id}`),
  clearUserMemories: (userId: number) => request.delete(`/ai-control/users/${userId}/memories`),

  getScheduledTasks: (params?: { page?: number; pageSize?: number; userId?: number | string; fired?: string }) =>
    request.get<PageResponse<ScheduledTask>>('/ai-control/scheduled-tasks', { params }),
  deleteScheduledTask: (id: number) => request.delete(`/ai-control/scheduled-tasks/${id}`),
};
