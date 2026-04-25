import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { COSService, COS_FOLDERS } from '../../../services/cos.service';

// 根据环境决定是否使用 COS
const USE_COS = !!(
  process.env.TENCENT_COS_SECRET_ID &&
  process.env.TENCENT_COS_SECRET_KEY &&
  process.env.TENCENT_COS_BUCKET
);

// 本地存储配置（备选）
const localStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, './uploads');
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

// 内存存储（用于 COS 上传，需要 buffer）
const memoryStorage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型，仅支持 JPEG、PNG、WEBP、SVG、ICO'));
  }
};

// 使用内存存储以支持 COS 上传
const upload = multer({
  storage: USE_COS ? memoryStorage : localStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const uploadMiddleware = upload.single('file');

export async function uploadFile(req: Request, res: Response) {
  if (!req.file) {
    res.status(400).json({ code: 400, message: '未检测到上传文件', timestamp: Date.now() });
    return;
  }

  try {
    let url: string;
    let key: string;
    let savedFilename: string;

    if (USE_COS) {
      // 使用 COS 上传（从内存获取 buffer）
      const folder = (req.query.folder as string) || COS_FOLDERS.TMP;
      const buffer = req.file.buffer;
      const result = await COSService.uploadFile(buffer, folder, req.file.originalname);
      url = result.url;
      key = result.key;
      savedFilename = req.file.originalname;
    } else {
      // 回退到本地存储（filename 由 diskStorage 生成）
      savedFilename = req.file.filename;
      url = `/uploads/${savedFilename}`;
      key = `tmp/${savedFilename}`;
    }

    res.json({
      code: 200,
      message: '上传成功',
      data: {
        url,
        key,
        filename: savedFilename,
        size: req.file.size,
        storage: USE_COS ? 'cos' : 'local',
      },
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('[Upload] 上传失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '上传失败',
      timestamp: Date.now(),
    });
  }
}
