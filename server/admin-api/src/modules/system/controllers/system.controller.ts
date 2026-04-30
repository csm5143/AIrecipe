import { Request, Response } from 'express';
import { settingsStore } from '../settingsStore';

export async function getSystemInfo(req: Request, res: Response) {
  res.json({
    code: 200,
    message: 'success',
    data: {
      name: process.env.APP_NAME || 'AIRecipe Admin API',
      env: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0',
      nodeVersion: process.version,
      uptime: process.uptime(),
      platform: process.platform,
    },
    timestamp: Date.now(),
  });
}

export async function getAllSettings(req: Request, res: Response) {
  const settings = settingsStore.getAll();
  res.json({ code: 200, message: 'success', data: settings, timestamp: Date.now() });
}

export async function getSiteSettings(req: Request, res: Response) {
  const data = settingsStore.get('site');
  res.json({ code: 200, message: 'success', data, timestamp: Date.now() });
}

export async function getSeoSettings(req: Request, res: Response) {
  const data = settingsStore.get('seo');
  res.json({ code: 200, message: 'success', data, timestamp: Date.now() });
}

export async function getLegalSettings(req: Request, res: Response) {
  const data = settingsStore.get('legal');
  res.json({ code: 200, message: 'success', data, timestamp: Date.now() });
}

export async function getSecuritySettings(req: Request, res: Response) {
  const data = settingsStore.get('security');
  res.json({ code: 200, message: 'success', data, timestamp: Date.now() });
}

export async function getEmailSettings(req: Request, res: Response) {
  const data = settingsStore.get('email');
  res.json({ code: 200, message: 'success', data, timestamp: Date.now() });
}

export async function updateSiteSettings(req: Request, res: Response) {
  settingsStore.set('site', req.body);
  res.json({ code: 200, message: '网站信息已保存', data: settingsStore.get('site'), timestamp: Date.now() });
}

export async function updateSeoSettings(req: Request, res: Response) {
  settingsStore.set('seo', req.body);
  res.json({ code: 200, message: 'SEO 设置已保存', data: settingsStore.get('seo'), timestamp: Date.now() });
}

export async function updateLegalSettings(req: Request, res: Response) {
  settingsStore.set('legal', req.body);
  res.json({ code: 200, message: '备案信息已保存', data: settingsStore.get('legal'), timestamp: Date.now() });
}

export async function updateSecuritySettings(req: Request, res: Response) {
  settingsStore.set('security', req.body);
  res.json({ code: 200, message: '安全设置已保存', data: settingsStore.get('security'), timestamp: Date.now() });
}

export async function updateEmailSettings(req: Request, res: Response) {
  settingsStore.set('email', req.body);
  res.json({ code: 200, message: '邮件设置已保存', data: settingsStore.get('email'), timestamp: Date.now() });
}
