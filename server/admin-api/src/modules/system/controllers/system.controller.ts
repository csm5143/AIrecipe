import { Request, Response } from 'express';
import config from '../../../config';

export async function getSystemInfo(req: Request, res: Response) {
  res.json({
    code: 200,
    message: 'success',
    data: {
      name: config.app.name,
      env: config.app.env,
      version: process.env.APP_VERSION || '1.0.0',
      nodeVersion: process.version,
      uptime: process.uptime(),
      platform: process.platform,
    },
    timestamp: Date.now(),
  });
}
