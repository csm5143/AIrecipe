import request from './request';

export type ReportStatus = 'pending' | 'in_progress' | 'resolved' | 'closed';

export interface ReportItem {
  id: number;
  reporterId: number | null;
  reporterName: string;
  reporterAvatar: string;
  targetContentId: string;
  type: string;
  reason: string;
  images: string[];
  status: ReportStatus;
  createdAt: number;
  updatedAt: number;
}

export interface ReportListResponse {
  list: ReportItem[];
  total: number;
  page: number;
  pageSize: number;
}

export const reportApi = {
  getReports(params: { page?: number; pageSize?: number; status?: ReportStatus | '' }) {
    return request.get<ReportListResponse>('/reports', { params });
  },

  getReport(id: number) {
    return request.get<ReportItem>(`/reports/${id}`);
  },

  handleReport(id: number, status: 'resolved' | 'closed') {
    return request.put(`/reports/${id}/handle`, { status });
  },
};

export const REPORT_STATUS_MAP: Record<ReportStatus, string> = {
  pending: '待处理',
  in_progress: '处理中',
  resolved: '已处理',
  closed: '已关闭',
};
