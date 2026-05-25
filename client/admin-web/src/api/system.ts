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

export interface AiSettings {
  provider: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  visionModel: string;
  temperature: number;
  maxTokens: number;
  imageMaxSize: number;
  enabled: boolean;
}

export interface SystemSettings {
  site: SiteSettings;
  seo: SeoSettings;
  legal: LegalSettings;
  security: SecuritySettings;
  email: EmailSettings;
  ai?: AiSettings;
}

export const systemApi = {
  getSettings: () =>
    request.get<ApiResponse<SystemSettings>>('/system/settings'),

  updateSettings: (category: keyof SystemSettings, data: any) =>
    request.put<ApiResponse<null>>(`/system/settings/${category}`, data),
};
