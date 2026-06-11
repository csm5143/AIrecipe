import { Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { COSService, COS_FOLDERS, getCOSStatus, isCOSConfigured } from '../../../services/cos.service';
import { prisma } from '../../../lib/prisma';
import config from '../../../config';
import { buildStorageKey, getImageExtension } from '../../../utils/storageKey';

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
  return getImageExtension(originalName, fallback);
}

function buildLocalKey(
  folder: string,
  originalName: string,
  options: Partial<Parameters<typeof buildStorageKey>[0]> = {},
) {
  return buildStorageKey({
    folder: resolveUploadFolder(folder),
    originalName,
    ...options,
  });
}

function getLocalUrl(key: string) {
  return `${config.upload.staticDir}/${key}`.replace(/\/{2,}/g, '/');
}

function writeLocalUpload(
  file: Express.Multer.File,
  folder: string,
  key?: string,
  options: Partial<Parameters<typeof buildStorageKey>[0]> = {},
) {
  ensureUploadDir();
  const localKey = key || buildLocalKey(folder, file.originalname, options);
  const fullPath = path.join(uploadDir, ...localKey.split('/').filter(Boolean));
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, file.buffer);
  return { url: getLocalUrl(localKey), key: localKey };
}

function successResponse(res: Response, url: string, key: string, filename: string, size: number) {
  res.json({
    code: 200,
    message: '涓婁紶鎴愬姛',
    data: { url, key, filename, size, storage: isCOSConfigured() ? 'cos' : 'local' },
    timestamp: Date.now(),
  });
}

function errorResponse(res: Response, status: number, message: string) {
  res.status(status).json({ code: status, message, timestamp: Date.now() });
}

function requireFile(req: Request, res: Response): req is Request & { file: Express.Multer.File } {
  if (!req.file) {
    errorResponse(res, 400, '鏈娴嬪埌涓婁紶鏂囦欢');
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
      cb(new Error('涓嶆敮鎸佺殑鏂囦欢绫诲瀷锛屼粎鏀寔 JPEG銆丳NG銆乄EBP銆丼VG銆両CO'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const uploadMiddleware: any = upload.single('file');

export async function getUploadCOSStatus(_req: Request, res: Response) {
  res.json({
    code: 200,
    message: '鏌ヨ鎴愬姛',
    data: getCOSStatus(),
    timestamp: Date.now(),
  });
}

export async function uploadFile(req: Request, res: Response) {
  if (!requireFile(req, res)) return;
  try {
    const folder = resolveUploadFolder(req.body.folder as string, COS_FOLDERS.TMP);
    const label = String(req.body.title || req.body.name || req.body.label || '').trim();
    const prefix = String(req.body.purpose || 'upload').trim();
    if (isCOSConfigured()) {
      const result = await COSService.uploadFile(req.file.buffer, folder, req.file.originalname, { label, prefix });
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    } else {
      const result = writeLocalUpload(req.file, folder, undefined, { label, prefix });
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    }
  } catch (err: any) {
    console.error('[Upload] 涓婁紶澶辫触:', err);
    errorResponse(res, 500, err.message || '涓婁紶澶辫触');
  }
}

const ALLOWED_SCAN_FOLDERS: string[] = [COS_FOLDERS.AI_SCAN, COS_FOLDERS.TMP];

export async function uploadScanImage(req: Request, res: Response) {
  if (!requireFile(req, res)) return;

  const folder = resolveUploadFolder(req.body.folder as string, COS_FOLDERS.AI_SCAN);
  if (!ALLOWED_SCAN_FOLDERS.includes(folder as any)) {
    errorResponse(res, 403, '涓嶅厑璁稿啓鍏ヨ鐩綍');
    return;
  }

  try {
    const label = String(req.body.title || req.body.name || 'scan').trim();
    if (isCOSConfigured()) {
      const result = await COSService.uploadFile(req.file.buffer, folder, req.file.originalname, { label, prefix: 'scan' });
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    } else {
      const result = writeLocalUpload(req.file, folder, undefined, { label, prefix: 'scan' });
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    }
  } catch (err: any) {
    console.error('[Upload/scan] 涓婁紶澶辫触:', err);
    errorResponse(res, 500, err.message || '涓婁紶澶辫触');
  }
}

export async function uploadRecipeCover(req: Request, res: Response) {
  if (!requireFile(req, res)) return;
  try {
    const recipeId = String(req.body.recipeId || 'draft');
    const title = String(req.body.title || '').trim();
    if (isCOSConfigured()) {
      const result = await COSService.uploadRecipeCover(req.file.buffer, recipeId, title || undefined);
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    } else {
      const result = writeLocalUpload(req.file, COS_FOLDERS.RECIPE_COVER, undefined, {
        segments: ['covers'],
        prefix: 'cover',
        label: title || `recipe-${recipeId}`,
      });
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    }
  } catch (err: any) {
    console.error('[Upload] 涓婁紶鑿滆氨灏侀潰澶辫触:', err);
    errorResponse(res, 500, err.message || '涓婁紶澶辫触');
  }
}

export async function uploadRecipeStep(req: Request, res: Response) {
  if (!requireFile(req, res)) return;
  try {
    const recipeId = String(req.body.recipeId || 'draft');
    const stepIndex = Number(req.body.stepIndex || 0);
    const title = String(req.body.title || '').trim();
    if (isCOSConfigured()) {
      const result = await COSService.uploadRecipeStep(req.file.buffer, recipeId, stepIndex, title || undefined);
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    } else {
      const result = writeLocalUpload(req.file, COS_FOLDERS.RECIPE_STEPS, undefined, {
        segments: [title || `recipe-${recipeId}`],
        prefix: 'step',
        label: title || `recipe-${recipeId}`,
        stepIndex,
      });
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    }
  } catch (err: any) {
    console.error('[Upload] 涓婁紶鑿滆氨姝ラ鍥剧墖澶辫触:', err);
    errorResponse(res, 500, err.message || '涓婁紶澶辫触');
  }
}

export async function uploadAdminAvatar(req: Request, res: Response) {
  if (!requireFile(req, res)) return;
  try {
    const adminId = (req as any).admin?.id;
    if (!adminId) {
      errorResponse(res, 401, 'Unauthorized');
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
    console.error('[Upload] 涓婁紶绠＄悊鍛樺ご鍍忓け璐?', err);
    errorResponse(res, 500, err.message || '涓婁紶澶辫触');
  }
}

export async function uploadUserAvatar(req: Request, res: Response) {
  if (!requireFile(req, res)) return;
  try {
    const userId = (req as any).userId || req.body.userId;
    if (!userId) {
      errorResponse(res, 401, 'Unauthorized');
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
    console.error('[Upload] 涓婁紶鐢ㄦ埛澶村儚澶辫触:', err);
    errorResponse(res, 500, err.message || '涓婁紶澶辫触');
  }
}

export async function uploadAiChatImage(req: Request, res: Response) {
  if (!requireFile(req, res)) return;
  try {
    const userId = (req as any).userId;
    if (!userId) {
      errorResponse(res, 401, 'Unauthorized');
      return;
    }

    const folder = `${COS_FOLDERS.AI_CHAT}/${userId}`;
    const label = String(req.body.title || req.body.name || 'chat-image').trim();
    if (isCOSConfigured()) {
      const result = await COSService.uploadFile(req.file.buffer, folder, req.file.originalname, { label, prefix: 'chat' });
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    } else {
      const result = writeLocalUpload(req.file, folder, undefined, { label, prefix: 'chat' });
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    }
  } catch (err: any) {
    console.error('[Upload] 涓婁紶 AI 鑱婂ぉ鍥剧墖澶辫触:', err);
    errorResponse(res, 500, err.message || '涓婁紶澶辫触');
  }
}

export async function uploadIngredient(req: Request, res: Response) {
  if (!requireFile(req, res)) return;
  try {
    const label = String(req.body.name || req.body.title || 'ingredient').trim();
    if (isCOSConfigured()) {
      const result = await COSService.uploadFile(req.file.buffer, COS_FOLDERS.INGREDIENTS, req.file.originalname, { label, prefix: 'ingredient' });
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    } else {
      const result = writeLocalUpload(req.file, COS_FOLDERS.INGREDIENTS, undefined, { label, prefix: 'ingredient' });
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    }
  } catch (err: any) {
    console.error('[Upload] 涓婁紶椋熸潗鍥剧墖澶辫触:', err);
    errorResponse(res, 500, err.message || '涓婁紶澶辫触');
  }
}

export async function uploadUserRecipeImage(req: Request, res: Response) {
  if (!requireFile(req, res)) return;
  try {
    const userId = (req as any).userId;
    if (!userId) {
      errorResponse(res, 401, 'Unauthorized');
      return;
    }

    const rawPurpose = String(req.body.purpose || 'image').trim();
    const purpose = ['cover', 'step', 'image'].includes(rawPurpose) ? rawPurpose : 'image';
    const title = String(req.body.title || req.body.recipeTitle || req.body.name || '').trim();
    const stepIndexValue = Number(req.body.stepIndex);
    const stepIndex = Number.isFinite(stepIndexValue) ? stepIndexValue : undefined;
    const subFolder = purpose === 'cover' ? 'covers' : purpose === 'step' ? 'steps' : 'images';
    const folder = `${COS_FOLDERS.USER_RECIPES}/${userId}/${subFolder}`;
    const uploadOptions = {
      label: title || `user-recipe-${purpose}`,
      prefix: purpose === 'image' ? 'recipe-image' : purpose,
      ...(stepIndex !== undefined ? { stepIndex } : {}),
    };
    if (isCOSConfigured()) {
      const result = await COSService.uploadFile(req.file.buffer, folder, req.file.originalname, uploadOptions);
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    } else {
      const result = writeLocalUpload(req.file, folder, undefined, uploadOptions);
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    }
  } catch (err: any) {
    console.error('[Upload] 涓婁紶鐢ㄦ埛鑿滆氨鍥剧墖澶辫触:', err);
    errorResponse(res, 500, err.message || '涓婁紶澶辫触');
  }
}

export async function uploadPostImage(req: Request, res: Response) {
  if (!requireFile(req, res)) return;
  try {
    const userId = (req as any).userId;
    if (!userId) {
      errorResponse(res, 401, 'Unauthorized');
      return;
    }

    const title = String(req.body.title || req.body.content || 'post-image').trim();
    const imageIndexValue = Number(req.body.imageIndex);
    const imageIndex = Number.isFinite(imageIndexValue) ? imageIndexValue : undefined;
    const folder = `${COS_FOLDERS.POSTS}/${userId}/images`;
    const uploadOptions = {
      label: title || 'post-image',
      prefix: 'post',
      ...(imageIndex !== undefined ? { index: imageIndex } : {}),
    };

    if (isCOSConfigured()) {
      const result = await COSService.uploadFile(req.file.buffer, folder, req.file.originalname, uploadOptions);
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    } else {
      const result = writeLocalUpload(req.file, folder, undefined, uploadOptions);
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    }
  } catch (err: any) {
    console.error('[Upload] upload post image failed:', err);
    errorResponse(res, 500, err.message || '娑撳﹣绱舵径杈Е');
  }
}

export async function uploadCollectionCover(req: Request, res: Response) {
  if (!requireFile(req, res)) return;
  try {
    const userId = (req as any).userId;
    if (!userId) {
      errorResponse(res, 401, 'Unauthorized');
      return;
    }

    const folder = `${COS_FOLDERS.FAVORITES}/${userId}/covers`;
    const label = String(req.body.title || req.body.name || 'collection-cover').trim();
    if (isCOSConfigured()) {
      const result = await COSService.uploadFile(req.file.buffer, folder, req.file.originalname, { label, prefix: 'collection-cover' });
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    } else {
      const result = writeLocalUpload(req.file, folder, undefined, { label, prefix: 'collection-cover' });
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    }
  } catch (err: any) {
    console.error('[Upload] 涓婁紶鏀惰棌澶瑰皝闈㈠け璐?', err);
    errorResponse(res, 500, err.message || '涓婁紶澶辫触');
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
    console.error('[Upload] 涓婁紶鍒嗙被鍥炬爣澶辫触:', err);
    errorResponse(res, 500, err.message || '涓婁紶澶辫触');
  }
}

export async function uploadFeedback(req: Request, res: Response) {
  if (!requireFile(req, res)) return;
  try {
    const label = String(req.body.title || req.body.type || 'feedback').trim();
    if (isCOSConfigured()) {
      const result = await COSService.uploadFile(req.file.buffer, COS_FOLDERS.FEEDBACK, req.file.originalname, { label, prefix: 'feedback' });
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    } else {
      const result = writeLocalUpload(req.file, COS_FOLDERS.FEEDBACK, undefined, { label, prefix: 'feedback' });
      successResponse(res, result.url, result.key, req.file.originalname, req.file.size);
    }
  } catch (err: any) {
    console.error('[Upload] 涓婁紶鍙嶉鍥剧墖澶辫触:', err);
    errorResponse(res, 500, err.message || '涓婁紶澶辫触');
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
        create: { category: 'site', key: type, value: url, description: type === 'logo' ? '缃戠珯Logo' : '缃戠珯鍥炬爣' },
        update: { value: url },
      });
    }

    successResponse(res, url, key, req.file.originalname, req.file.size);
  } catch (err: any) {
    console.error('[Upload] 涓婁紶绯荤粺璁剧疆鍥剧墖澶辫触:', err);
    errorResponse(res, 500, err.message || '涓婁紶澶辫触');
  }
}
