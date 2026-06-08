/**
 * 腾讯云 COS 服务
 * 用于服务端上传文件到 COS
 */

import COS from 'cos-nodejs-sdk-v5';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';

// 从环境变量读取 COS 配置。不要提供默认 bucket，避免配置错误时静默写到错误位置。
const cosConfig = config.cos;

export function isCOSConfigured(): boolean {
  return !!(
    cosConfig.secretId &&
    cosConfig.secretKey &&
    cosConfig.bucket &&
    cosConfig.region &&
    cosConfig.baseUrl
  );
}

export function getCOSStatus() {
  return {
    enabled: isCOSConfigured(),
    bucket: cosConfig.bucket || null,
    region: cosConfig.region || null,
    baseUrl: cosConfig.baseUrl || null,
    folders: COS_FOLDERS,
  };
}

// 文件夹类型
export const COS_FOLDERS = {
  ADMINS: 'admins',
  AVATARS: 'avatars',
  RECIPES: 'recipes',
  RECIPE_COVER: 'recipes',
  RECIPE_STEPS: 'recipes/steps',
  FAVORITES: 'favorites',
  USER_RECIPES: 'user-recipes',
  FEEDBACK: 'feedback',
  BANNERS: 'banners',
  CATEGORIES: 'categories',
  INGREDIENTS: 'ingredients',
  SETTINGS: 'settings',
  AI_CHAT: 'ai-chat',
  AI_SCAN: 'ai-scan',
  AI_GENERATED: 'ai-generated',
  TMP: 'tmp',
} as const;

// 初始化 COS 客户端
const cos = new COS({
  SecretId: cosConfig.secretId,
  SecretKey: cosConfig.secretKey,
});

function assertCOSConfigured() {
  if (!isCOSConfigured()) {
    throw new Error('COS 未配置完整，请检查 TENCENT_COS_SECRET_ID、TENCENT_COS_SECRET_KEY、TENCENT_COS_BUCKET、TENCENT_COS_REGION、TENCENT_COS_BASE_URL');
  }
}

// 获取完整 URL
function getCOSUrl(key: string): string {
  return `${cosConfig.baseUrl.replace(/\/$/, '')}/${key}`;
}

// 生成 COS Key
function generateCOSKey(folder: string, fileName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')) : '.jpg';
  return `${folder}/${timestamp}_${random}${ext}`;
}

/**
 * COS 上传服务类
 */
export class COSService {
  /**
   * 上传文件到 COS
   */
  static async uploadFile(
    buffer: Buffer,
    folder: string,
    originalName: string
  ): Promise<{ url: string; key: string }> {
    const ext = originalName.substring(originalName.lastIndexOf('.')) || '.jpg';
    const key = generateCOSKey(folder as any, `${uuidv4()}${ext}`);
    assertCOSConfigured();

    return new Promise((resolve, reject) => {
      cos.putObject(
        {
          Bucket: cosConfig.bucket,
          Region: cosConfig.region,
          Key: key,
          Body: buffer,
          ContentLength: buffer.length,
        },
        (err, data) => {
          if (err) {
            console.error('[COSService] 上传失败:', err);
            reject(new Error('上传到云存储失败'));
          } else {
            resolve({
              url: getCOSUrl(key),
              key,
            });
          }
        }
      );
    });
  }

  /**
   * 上传菜谱封面
   */
  static async uploadRecipeCover(buffer: Buffer, recipeId: string): Promise<{ url: string; key: string }> {
    const key = `${COS_FOLDERS.RECIPE_COVER}/${recipeId}/cover_${Date.now()}.jpg`;
    assertCOSConfigured();
    
    return new Promise((resolve, reject) => {
      cos.putObject(
        {
          Bucket: cosConfig.bucket,
          Region: cosConfig.region,
          Key: key,
          Body: buffer,
          ContentLength: buffer.length,
        },
        (err, data) => {
          if (err) {
            reject(new Error('上传菜谱封面失败'));
          } else {
            resolve({
              url: getCOSUrl(key),
              key,
            });
          }
        }
      );
    });
  }

  /**
   * 上传菜谱步骤图
   */
  static async uploadRecipeStep(
    buffer: Buffer,
    recipeId: string,
    stepIndex: number
  ): Promise<{ url: string; key: string }> {
    const key = `${COS_FOLDERS.RECIPE_STEPS}/${recipeId}/step_${stepIndex}_${Date.now()}.jpg`;
    assertCOSConfigured();
    
    return new Promise((resolve, reject) => {
      cos.putObject(
        {
          Bucket: cosConfig.bucket,
          Region: cosConfig.region,
          Key: key,
          Body: buffer,
          ContentLength: buffer.length,
        },
        (err, data) => {
          if (err) {
            reject(new Error('上传步骤图失败'));
          } else {
            resolve({
              url: getCOSUrl(key),
              key,
            });
          }
        }
      );
    });
  }

  /**
   * 上传用户头像（覆盖式：同用户始终覆盖 avatar.jpg，通过 URL 参数刷新缓存）
   */
  static async uploadAvatar(buffer: Buffer, userId: string): Promise<{ url: string; key: string }> {
    const key = `${COS_FOLDERS.AVATARS}/${userId}/avatar.jpg`;
    assertCOSConfigured();
    
    return new Promise((resolve, reject) => {
      cos.putObject(
        {
          Bucket: cosConfig.bucket,
          Region: cosConfig.region,
          Key: key,
          Body: buffer,
          ContentLength: buffer.length,
        },
        (err, data) => {
          if (err) {
            reject(new Error('上传头像失败'));
          } else {
            resolve({
              url: getCOSUrl(key),
              key,
            });
          }
        }
      );
    });
  }

  /**
   * 上传 Banner 图片
   */
  static async uploadBanner(buffer: Buffer): Promise<{ url: string; key: string }> {
    const key = generateCOSKey(COS_FOLDERS.BANNERS, `banner_${Date.now()}.jpg`);
    assertCOSConfigured();
    
    return new Promise((resolve, reject) => {
      cos.putObject(
        {
          Bucket: cosConfig.bucket,
          Region: cosConfig.region,
          Key: key,
          Body: buffer,
          ContentLength: buffer.length,
        },
        (err, data) => {
          if (err) {
            reject(new Error('上传Banner失败'));
          } else {
            resolve({
              url: getCOSUrl(key),
              key,
            });
          }
        }
      );
    });
  }

  /**
   * 上传管理员头像（覆盖式：同管理员始终覆盖 avatar.jpg）
   */
  static async uploadAdminAvatar(buffer: Buffer, adminId: number): Promise<{ url: string; key: string }> {
    const key = `${COS_FOLDERS.ADMINS}/${adminId}/avatar.jpg`;
    assertCOSConfigured();

    return new Promise((resolve, reject) => {
      cos.putObject(
        {
          Bucket: cosConfig.bucket,
          Region: cosConfig.region,
          Key: key,
          Body: buffer,
          ContentLength: buffer.length,
        },
        (err, data) => {
          if (err) {
            reject(new Error('上传管理员头像失败'));
          } else {
            resolve({
              url: getCOSUrl(key),
              key,
            });
          }
        }
      );
    });
  }

  /**
   * 上传分类图标
   */
  static async uploadCategoryIcon(buffer: Buffer, username: string): Promise<{ url: string; key: string }> {
    const key = `${COS_FOLDERS.CATEGORIES}/${username}/icon_${Date.now()}.png`;
    assertCOSConfigured();

    return new Promise((resolve, reject) => {
      cos.putObject(
        {
          Bucket: cosConfig.bucket,
          Region: cosConfig.region,
          Key: key,
          Body: buffer,
          ContentLength: buffer.length,
        },
        (err, data) => {
          if (err) {
            reject(new Error('上传分类图标失败'));
          } else {
            resolve({
              url: getCOSUrl(key),
              key,
            });
          }
        }
      );
    });
  }

  /**
   * 上传系统设置图片（覆盖式：settings/{type}.png，如 settings/logo.png）
   */
  static async uploadSettings(buffer: Buffer, type: string, _username: string): Promise<{ url: string; key: string }> {
    const ext = type.includes('.') ? type.substring(type.lastIndexOf('.')) : '.png';
    const name = type.replace(/\.[^.]+$/, '');
    const key = `${COS_FOLDERS.SETTINGS}/${name}${ext}`;
    assertCOSConfigured();

    return new Promise((resolve, reject) => {
      cos.putObject(
        {
          Bucket: cosConfig.bucket,
          Region: cosConfig.region,
          Key: key,
          Body: buffer,
          ContentLength: buffer.length,
        },
        (err, data) => {
          if (err) {
            reject(new Error('上传系统设置图片失败'));
          } else {
            resolve({
              url: getCOSUrl(key),
              key,
            });
          }
        }
      );
    });
  }

  /**
   * 生成不重复的 COS key：检查是否存在，存在则加 -2, -3...
   */
  static async uniqueKey(baseKey: string): Promise<string> {
    assertCOSConfigured();
    const dir = baseKey.substring(0, baseKey.lastIndexOf('/'));
    const name = baseKey.substring(baseKey.lastIndexOf('/') + 1);
    const dotIdx = name.lastIndexOf('.');
    const stem = dotIdx > 0 ? name.substring(0, dotIdx) : name;
    const ext = dotIdx > 0 ? name.substring(dotIdx) : '.png';

    let candidate = baseKey;
    let n = 2;
    while (true) {
      const exists = await new Promise<boolean>((resolve) => {
        cos.headObject(
          { Bucket: cosConfig.bucket, Region: cosConfig.region, Key: candidate },
          (err: any) => resolve(!err),
        );
      });
      if (!exists) return candidate;
      candidate = `${dir}/${stem}-${n}${ext}`;
      n++;
    }
  }

  /**
   * 按指定 key 上传文件（保留自定义文件名）
   */
  static async uploadWithKey(buffer: Buffer, key: string): Promise<{ url: string; key: string }> {
    assertCOSConfigured();
    return new Promise((resolve, reject) => {
      cos.putObject(
        {
          Bucket: cosConfig.bucket,
          Region: cosConfig.region,
          Key: key,
          Body: buffer,
          ContentLength: buffer.length,
        },
        (err) => {
          if (err) {
            console.error('[COSService] 上传失败:', err);
            reject(new Error('上传到云存储失败'));
          } else {
            resolve({ url: getCOSUrl(key), key });
          }
        }
      );
    });
  }

  /**
   * 删除文件
   */
  static async deleteFile(key: string): Promise<void> {
    assertCOSConfigured();
    return new Promise((resolve, reject) => {
      cos.deleteObject(
        {
          Bucket: cosConfig.bucket,
          Region: cosConfig.region,
          Key: key,
        },
        (err, data) => {
          if (err) {
            reject(new Error('删除文件失败'));
          } else {
            resolve();
          }
        }
      );
    });
  }
}

export default COSService;
