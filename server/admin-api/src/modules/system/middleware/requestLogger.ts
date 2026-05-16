import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';

const stream = {
  write: (message: string) => {
    const logPath = path.join(process.cwd(), 'logs', 'access.log');
    const logDir = path.dirname(logPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    fs.appendFileSync(logPath, message);
  },
};

const skip = () => {
  const env = process.env.NODE_ENV || 'development';
  return env !== 'development';
};

export const requestLogger = morgan(
  ':method :url :status :res[content-length] - :response-time ms :remote-addr :user-agent',
  { stream, skip }
);
