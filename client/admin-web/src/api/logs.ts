import request from './request';

export interface LogItem {
  id: number;
  adminId: number;
  adminName: string;
  action: string;
  module: string;
  target: string;
  detail: string;
  ip: string;
  createdAt: string;
}

export interface LogListResponse {
  data: LogItem[];
  total: number;
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export const logsApi = {
  list: (params: { page?: number; pageSize?: number; module?: string; action?: string; adminId?: string; startDate?: string; endDate?: string }) =>
    request.get<any>('/logs', { params }),
};
