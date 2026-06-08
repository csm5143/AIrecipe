import { Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { COSService, COS_FOLDERS, getCOSStatus, isCOSConfigured } from '../../../services/cos.service';
import { prisma } from '../../../lib/prisma';
import config from '../../../config';

const uploadDir = path.resolve(config.upload.uploadDir);
const folderAliases: Record<string, string> = Object.fromEntries(
  Object.entries(COS_FOLDERS).flatMap(([key, value]) => [
    [key, value],
    [value, value],
  ]),
);

function ensureUploadDir() {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}

function resolveUploadFolder(folder?: string, fallback: string = COS_FOLDERS.TMP): string {
  const raw = String(folder || fallback)
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '');
  const normalized = folderAliases[raw] || raw || fallback;
  const cleanFolder = normalized
    .split('/')
    .filter((part) => part && part !== '.' && part !== '..')
    .join('/');

  const allowedRoots = Object.values(COS_FOLDERS);
  const isAllowed = allowedRoots.some((root) => cleanFolder === root || cleanFolder.startsWith(`${root}/`));
  return isAllowed ? cleanFolder : fallback;
}

function getExt(originalName: string, fallback = '.jpg') {
  return path.extname(originalName) || fallback;
}

function buildLocalKey(folder: string, originalName: string) {
  const filename = `${Date.now()}_${uuidv4()}${getExt(originalName)}`;
  return path.posix.join(resolveUploadFolder(folder), filename);
}

function getLocalUrl(key: string) {
  return `${config.upload.staticDir}/${key}`.replace(/\/{2,}/g, '/');
}

function writeLocalUpload(file: Express.Multer.File, folder: string, key?: string) {
  ensureUploadDir();
  const localKey = key || buildLocalKey(folder, file.originalname);
  const fullPath = path.join(uploadDir, ...localKey.split('/').filter(Boolean));
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, file.buffer);
  return { url: getLocalUrl(localKey), key: localKey };
}

function successResponse(res: Response, url: string, key: string, filename: string, size: number) {
  res.json({
    code: 200,
    message: '上传成功',
    data: { url, key, filename, size, storage: isCOSConfigured() ? 'cos' : 'local' },
    timestamp: Date.now(),
  });
}

function errorResponse(res: Response, status: number, message: string) {
  res.status(status).json({ code: status, message, timestamp: Date.now() });
}

function requireFile(req: Request, res: Response): req is Request & { file: Express.Multer.File } {
  if (!req.file) {
    errorResponse(res, 400, '未检测到上传文件');
    return false;
  }
  return true;
}

async function getCurrentAdminUsername(req: Request): Promise<string> {
  try {
    const adminId = (req as any).admin?.id;
    if (adminId) {
      const admin = await prisma.admin.findUnique({ where: { id: adminId, isDeleted: false } });
      if (admin) return admin.username;
    }
  } catch (err) {
    console.error('[Upload] getCurrentAdminUsername failed:', (err as Error)?.message);
  }
  return 'anonymous';
}

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型，仅支持 JPEG、PNG、WEBP、SVG、ICO'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const uploadMiddleware: any = upload.single('file');

export async function getUploadCOSStatus(_req: Request, res: Response) {
  res.json({
    code: 200,
    message: '查询成功',
    data: getCOSStatus(),
    timestamp: Date.now(),
  });
}

export async function uploadFile(req: Request, res: Response) {
  if (!requireFile(req, res)) return;
  try {
    const folder = resolveUploadFolder(req.body.folder as string, COS_FOLDERS.TMP);
    if (isCOSConfigured()) {
      const result = await COSService.uploadFile(req.file.buffer, folder, req.file.originalname);
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    } else {
      const result = writeLocalUpload(req.file, folder);
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    }
  } catch (err: any) {
    console.error('[Upload] 上传失败:', err);
    errorResponse(res, 500, err.message || '上传失败');
  }
}

const ALLOWED_SCAN_FOLDERS: string[] = [COS_FOLDERS.AI_SCAN, COS_FOLDERS.TMP];

export async function uploadScanImage(req: Request, res: Response) {
  if (!requireFile(req, res)) return;

  const folder = resolveUploadFolder(req.body.folder as string, COS_FOLDERS.AI_SCAN);
  if (!ALLOWED_SCAN_FOLDERS.includes(folder as any)) {
    errorResponse(res, 403, '不允许写入该目录');
    return;
  }

  try {
    if (isCOSConfigured()) {
      const result = await COSService.uploadFile(req.file.buffer, folder, req.file.originalname);
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    } else {
      const result = writeLocalUpload(req.file, folder);
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    }
  } catch (err: any) {
    console.error('[Upload/scan] 上传失败:', err);
    errorResponse(res, 500, err.message || '上传失败');
  }
}

export async function uploadRecipeCover(req: Request, res: Response) {
  if (!requireFile(req, res)) return;
  try {
    const recipeId = String(req.body.recipeId || 'draft');
    if (isCOSConfigured()) {
      const result = await COSService.uploadRecipeCover(req.file.buffer, recipeId);
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    } else {
      const result = writeLocalUpload(req.file, COS_FOLDERS.RECIPE_COVER);
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    }
  } catch (err: any) {
    console.error('[Upload] 上传菜谱封面失败:', err);
    errorResponse(res, 500, err.message || '上传失败');
  }
}

export async function uploadRecipeStep(req: Request, res: Response) {
  if (!requireFile(req, res)) return;
  try {
    const recipeId = String(req.body.recipeId || 'draft');
    const stepIndex = Number(req.body.stepIndex || 0);
    if (isCOSConfigured()) {
      const result = await COSService.uploadRecipeStep(req.file.buffer, recipeId, stepIndex);
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    } else {
      const result = writeLocalUpload(req.file, COS_FOLDERS.RECIPE_STEPS);
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    }
  } catch (err: any) {
    console.error('[Upload] 上传菜谱步骤图片失败:', err);
    errorResponse(res, 500, err.message || '上传失败');
  }
}

export async function uploadAdminAvatar(req: Request, res: Response) {
  if (!requireFile(req, res)) return;
  try {
    const adminId = (req as any).admin?.id;
    if (!adminId) {
      errorResponse(res, 401, '未登录');
      return;
    }

    if (isCOSConfigured()) {
      const result = await COSService.uploadAdminAvatar(req.file.buffer, adminId);
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    } else {
      const key = `${COS_FOLDERS.ADMINS}/${adminId}/avatar${getExt(req.file.originalname)}`;
      const result = writeLocalUpload(req.file, COS_FOLDERS.ADMINS, key);
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    }
  } catch (err: any) {
    console.error('[Upload] 上传管理员头像失败:', err);
    errorResponse(res, 500, err.message || '上传失败');
  }
}

export async function uploadUserAvatar(req: Request, res: Response) {
  if (!requireFile(req, res)) return;
  try {
    const userId = (req as any).userId || req.body.userId;
    if (!userId) {
      errorResponse(res, 401, '未登录');
      return;
    }

    if (isCOSConfigured()) {
      const result = await COSService.uploadAvatar(req.file.buffer, String(userId));
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    } else {
      const key = `${COS_FOLDERS.AVATARS}/${userId}/avatar${getExt(req.file.originalname)}`;
      const result = writeLocalUpload(req.file, COS_FOLDERS.AVATARS, key);
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    }
  } catch (err: any) {
    console.error('[Upload] 上传用户头像失败:', err);
    errorResponse(res, 500, err.message || '上传失败');
  }
}

export async function uploadAiChatImage(req: Request, res: Response) {
  if (!requireFile(req, res)) return;
  try {
    const userId = (req as any).userId;
    if (!userId) {
      errorResponse(res, 401, '未登录');
      return;
    }

    const folder = `${COS_FOLDERS.AI_CHAT}/${userId}`;
    if (isCOSConfigured()) {
      const result = await COSService.uploadFile(req.file.buffer, folder, req.file.originalname);
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    } else {
      const result = writeLocalUpload(req.file, folder);
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    }
  } catch (err: any) {
    console.error('[Upload] 上传 AI 聊天图片失败:', err);
    errorResponse(res, 500, err.message || '上传失败');
  }
}

export async function uploadIngredient(req: Request, res: Response) {
  if (!requireFile(req, res)) return;
  try {
    if (isCOSConfigured()) {
      const result = await COSService.uploadFile(req.file.buffer, COS_FOLDERS.INGREDIENTS, req.file.originalname);
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    } else {
      const result = writeLocalUpload(req.file, COS_FOLDERS.INGREDIENTS);
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    }
  } catch (err: any) {
    console.error('[Upload] 上传食材图片失败:', err);
    errorResponse(res, 500, err.message || '上传失败');
  }
}

export async function uploadUserRecipeImage(req: Request, res: Response) {
  if (!requireFile(req, res)) return;
  try {
    const userId = (req as any).userId;
    if (!userId) {
      errorResponse(res, 401, '未登录');
      return;
    }

    const folder = `${COS_FOLDERS.USER_RECIPES}/${userId}`;
    if (isCOSConfigured()) {
      const result = await COSService.uploadFile(req.file.buffer, folder, req.file.originalname);
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    } else {
      const result = writeLocalUpload(req.file, folder);
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    }
  } catch (err: any) {
    console.error('[Upload] 上传用户菜谱图片失败:', err);
    errorResponse(res, 500, err.message || '上传失败');
  }
}

export async function uploadCollectionCover(req: Request, res: Response) {
  if (!requireFile(req, res)) return;
  try {
    const userId = (req as any).userId;
    if (!userId) {
      errorResponse(res, 401, '未登录');
      return;
    }

    const folder = `${COS_FOLDERS.FAVORITES}/${userId}`;
    if (isCOSConfigured()) {
      const result = await COSService.uploadFile(req.file.buffer, folder, req.file.originalname);
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    } else {
      const result = writeLocalUpload(req.file, folder);
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    }
  } catch (err: any) {
    console.error('[Upload] 上传收藏夹封面失败:', err);
    errorResponse(res, 500, err.message || '上传失败');
  }
}

export async function uploadCategoryIcon(req: Request, res: Response) {
  if (!requireFile(req, res)) return;
  try {
    const username = await getCurrentAdminUsername(req);
    if (isCOSConfigured()) {
      const result = await COSService.uploadCategoryIcon(req.file.buffer, username);
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    } else {
      const result = writeLocalUpload(req.file, `${COS_FOLDERS.CATEGORIES}/${username}`);
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    }
  } catch (err: any) {
    console.error('[Upload] 上传分类图标失败:', err);
    errorResponse(res, 500, err.message || '上传失败');
  }
}

export async function uploadFeedback(req: Request, res: Response) {
  if (!requireFile(req, res)) return;
  try {
    if (isCOSConfigured()) {
      const result = await COSService.uploadFile(req.file.buffer, COS_FOLDERS.FEEDBACK, req.file.originalname);
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    } else {
      const result = writeLocalUpload(req.file, COS_FOLDERS.FEEDBACK);
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    }
  } catch (err: any) {
    console.error('[Upload] 上传反馈图片失败:', err);
    errorResponse(res, 500, err.message || '上传失败');
  }
}

export async function uploadSettings(req: Request, res: Response) {
  if (!requireFile(req, res)) return;
  try {
    const type = String(req.body.type || 'image');

    let url: string;
    let key: string;
    if (isCOSConfigured()) {
      const result = await COSService.uploadSettings(req.file.buffer, type, 'system');
      url = result.url;
      key = result.key;
    } else {
      const ext = getExt(req.file.originalname, '.png');
      const result = writeLocalUpload(req.file, COS_FOLDERS.SETTINGS, `${COS_FOLDERS.SETTINGS}/${type}${ext}`);
      url = result.url;
      key = result.key;
    }

    if (type === 'logo' || type === 'favicon') {
      await prisma.systemSetting.upsert({
        where: { category_key: { category: 'site', key: type } },
        create: { category: 'site', key: type, value: url, description: type === 'logo' ? '网站Logo' : '网站图标' },
        update: { value: url },
      });
    }

    successResponse(res, url, key, req.file.originalname, req.file.size);
  } catch (err: any) {
    console.error('[Upload] 上传系统设置图片失败:', err);
    errorResponse(res, 500, err.message || '上传失败');
  }
}
