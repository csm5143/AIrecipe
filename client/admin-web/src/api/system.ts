import request from './request';
import type { ApiResponse } from '@airecipe/shared-types';

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  logo: string;
  favicon: string;
}

export interface SeoSettings {
  title: string;
  keywords: string;
  description: string;
}

export interface LegalSettings {
  icp: string;
  psbe: string;
  copyright: string;
  company: string;
  phone: string;
}

export interface SecuritySettings {
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordRequirements: string[];
  enableOperationLog: boolean;
}

export interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  encryption: 'none' | 'ssl' | 'tls';
  fromEmail: string;
  fromName: string;
  username: string;
  password: string;
}

export interface SystemSettings {
  site: SiteSettings;
  seo: SeoSettings;
  legal: LegalSettings;
  security: SecuritySettings;
  email: EmailSettings;
}

export const systemApi = {
  getSettings: () =>
    request.get<ApiResponse<SystemSettings>>('/system/settings'),

  updateSettings: (category: keyof SystemSettings, data: any) =>
    request.put<ApiResponse<null>>(`/system/settings/${category}`, data),

  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request.post<ApiResponse<{ url: string; filename: string; size: number }>>(
      '/upload',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },
};
