import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, './uploads');
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型，仅支持 JPEG、PNG、WEBP、SVG、ICO'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const uploadMiddleware = upload.single('file');

export async function uploadFile(req: Request, res: Response) {
  if (!req.file) {
    res.status(400).json({ code: 400, message: '未检测到上传文件', timestamp: Date.now() });
    return;
  }
  res.json({
    code: 200,
    message: '上传成功',
    data: {
      url: `/uploads/${req.file.filename}`,
      filename: req.file.originalname,
      size: req.file.size,
    },
    timestamp: Date.now(),
  });
}
