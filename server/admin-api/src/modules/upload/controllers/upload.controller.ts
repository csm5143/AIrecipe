import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { COSService, COS_FOLDERS } from '../../../services/cos.service';
import { prisma } from '../../../lib/prisma';

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

export const uploadMiddleware: any = upload.single('file');

// 统一的响应结构
function successResponse(res: Response, url: string, key: string, filename: string, size: number) {
  res.json({
    code: 200,
    message: '上传成功',
    data: { url, key, filename, size, storage: USE_COS ? 'cos' : 'local' },
    timestamp: Date.now(),
  });
}

function errorResponse(res: Response, status: number, message: string) {
  res.status(status).json({ code: status, message, timestamp: Date.now() });
}

// 仅允许小程序拍照识别写入 ai-scan 文件夹的白名单
const ALLOWED_SCAN_FOLDERS = [COS_FOLDERS.AI_SCAN, COS_FOLDERS.TMP];

// 获取当前登录管理员的 username，用于 COS 目录组织
async function getCurrentAdminUsername(req: Request): Promise<string> {
  try {
    const adminId = (req as any).admin?.id;
    const username = (req as any).admin?.username;
    console.log(`[Upload] getCurrentAdminUsername - adminId=${adminId}, username=${username}`);
    if (adminId) {
      const admin = await prisma.admin.findUnique({ where: { id: adminId, isDeleted: false } });
      console.log(`[Upload] DB lookup adminId=${adminId}, found username=${admin?.username ?? 'NOT_FOUND'}`);
      if (admin) return admin.username;
    }
  } catch (err) {
    console.error('[Upload] getCurrentAdminUsername 失败，使用 anonymous:', (err as Error)?.message);
  }
  return 'anonymous';
}

// 通用文件上传（按 folder 上传）
export async function uploadFile(req: Request, res: Response) {
  if (!req.file) {
    errorResponse(res, 400, '未检测到上传文件');
    return;
  }
  try {
    if (USE_COS) {
      const folder = (req.body.folder as string) || COS_FOLDERS.TMP;
      const result = await COSService.uploadFile(req.file.buffer, folder, req.file.originalname);
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    } else {
      successResponse(res, `/uploads/${req.file.filename}`, `tmp/${req.file.filename}`, req.file.filename, req.file.size);
    }
  } catch (err: any) {
    console.error('[Upload] 上传失败:', err);
    errorResponse(res, 500, err.message || '上传失败');
  }
}

// 小程序拍照识别专用上传接口（无需管理员认证，但限制只能写入 ai-scan/）
export async function uploadScanImage(req: Request, res: Response) {
  if (!req.file) {
    errorResponse(res, 400, '未检测到上传文件');
    return;
  }

  const requestedFolder = (req.body.folder as string) || COS_FOLDERS.AI_SCAN;
  // 安全校验：只允许写入白名单中的文件夹
  if (!ALLOWED_SCAN_FOLDERS.includes(requestedFolder as any)) {
    errorResponse(res, 403, '不允许写入该目录');
    return;
  }

  try {
    if (USE_COS) {
      const result = await COSService.uploadFile(req.file.buffer, requestedFolder, req.file.originalname);
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    } else {
      successResponse(res, `/uploads/${req.file.filename}`, `${requestedFolder}/${req.file.filename}`, req.file.filename, req.file.size);
    }
  } catch (err: any) {
    console.error('[Upload/scan] 上传失败:', err);
    errorResponse(res, 500, err.message || '上传失败');
  }
}

// 上传管理员头像
export async function uploadAdminAvatar(req: Request, res: Response) {
  if (!req.file) {
    errorResponse(res, 400, '未检测到上传文件');
    return;
  }
  try {
    const username = await getCurrentAdminUsername(req);
    if (USE_COS) {
      const result = await COSService.uploadAdminAvatar(req.file.buffer, username);
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    } else {
      successResponse(res, `/uploads/${req.file.filename}`, `admins/${username}/${req.file.filename}`, req.file.filename, req.file.size);
    }
  } catch (err: any) {
    console.error('[Upload] 上传管理员头像失败:', err);
    errorResponse(res, 500, err.message || '上传失败');
  }
}

// 上传用户头像
export async function uploadUserAvatar(req: Request, res: Response) {
  if (!req.file) {
    errorResponse(res, 400, '未检测到上传文件');
    return;
  }
  try {
    const userId = req.body.userId || 'default';
    if (USE_COS) {
      const result = await COSService.uploadAvatar(req.file.buffer, userId);
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    } else {
      successResponse(res, `/uploads/${req.file.filename}`, `avatars/${userId}/${req.file.filename}`, req.file.filename, req.file.size);
    }
  } catch (err: any) {
    console.error('[Upload] 上传用户头像失败:', err);
    errorResponse(res, 500, err.message || '上传失败');
  }
}

// 上传食材图片
export async function uploadIngredient(req: Request, res: Response) {
  if (!req.file) {
    errorResponse(res, 400, '未检测到上传文件');
    return;
  }
  try {
    if (USE_COS) {
      const result = await COSService.uploadFile(req.file.buffer, COS_FOLDERS.INGREDIENTS, req.file.originalname);
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    } else {
      successResponse(res, `/uploads/${req.file.filename}`, `ingredients/${req.file.filename}`, req.file.filename, req.file.size);
    }
  } catch (err: any) {
    console.error('[Upload] 上传食材图片失败:', err);
    errorResponse(res, 500, err.message || '上传失败');
  }
}

// 上传分类图标
export async function uploadCategoryIcon(req: Request, res: Response) {
  if (!req.file) {
    errorResponse(res, 400, '未检测到上传文件');
    return;
  }
  try {
    const username = await getCurrentAdminUsername(req);
    if (USE_COS) {
      const result = await COSService.uploadCategoryIcon(req.file.buffer, username);
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    } else {
      successResponse(res, `/uploads/${req.file.filename}`, `categories/${username}/${req.file.filename}`, req.file.filename, req.file.size);
    }
  } catch (err: any) {
    console.error('[Upload] 上传分类图标失败:', err);
    errorResponse(res, 500, err.message || '上传失败');
  }
}

// 上传反馈附图
export async function uploadFeedback(req: Request, res: Response) {
  if (!req.file) {
    errorResponse(res, 400, '未检测到上传文件');
    return;
  }
  try {
    if (USE_COS) {
      const result = await COSService.uploadFile(req.file.buffer, COS_FOLDERS.FEEDBACK, req.file.originalname);
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    } else {
      successResponse(res, `/uploads/${req.file.filename}`, `feedback/${req.file.filename}`, req.file.filename, req.file.size);
    }
  } catch (err: any) {
    console.error('[Upload] 上传反馈图片失败:', err);
    errorResponse(res, 500, err.message || '上传失败');
  }
}

// 上传系统设置图片（Logo、Favicon 等）
export async function uploadSettings(req: Request, res: Response) {
  if (!req.file) {
    errorResponse(res, 400, '未检测到上传文件');
    return;
  }
  try {
    const username = await getCurrentAdminUsername(req);
    const type = (req.body.type as string) || 'image';
    if (USE_COS) {
      const result = await COSService.uploadSettings(req.file.buffer, type, username);
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    } else {
      successResponse(res, `/uploads/${req.file.filename}`, `settings/${username}/${req.file.filename}`, req.file.filename, req.file.size);
    }
  } catch (err: any) {
    console.error('[Upload] 上传系统设置图片失败:', err);
    errorResponse(res, 500, err.message || '上传失败');
  }
}
