import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';

const LOG_PATH = path.join(process.cwd(), 'logs', 'access.log');
const LOG_DIR = path.dirname(LOG_PATH);

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}
ensureLogDir();

const stream = {
  write: (message: string) => {
    // 异步写入，不阻塞事件循环
    fs.appendFile(LOG_PATH, message, (err) => {
      if (err) {
        // 只在写入失败时输出到 stderr
        process.stderr.write(`[access.log] write error: ${err.message}\n`);
      }
    });
  },
};

const skip = () => {
  // 生产环境不输出到 stdout（morgan combined 在 index.ts 中处理）
  return process.env.NODE_ENV === 'production';
};

export const requestLogger = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  { stream, skip }
);
