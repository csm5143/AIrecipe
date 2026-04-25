/**
 * 腾讯云 COS 服务
 * 用于服务端上传文件到 COS
 */

import COS from 'cos-nodejs-sdk-v5';
import { v4 as uuidv4 } from 'uuid';

// 从环境变量读取 COS 配置
const cosConfig = {
  SecretId: process.env.TENCENT_COS_SECRET_ID || '',
  SecretKey: process.env.TENCENT_COS_SECRET_KEY || '',
  Bucket: process.env.TENCENT_COS_BUCKET || 'dish-1367781796',
  Region: process.env.TENCENT_COS_REGION || 'ap-guangzhou',
  BaseUrl: process.env.TENCENT_COS_BASE_URL || 'https://dish-1367781796.cos.ap-guangzhou.myqcloud.com',
};

// 文件夹类型
export const COS_FOLDERS = {
  AVATARS: 'avatars',
  RECIPES: 'recipes',
  RECIPE_COVER: 'recipes',
  RECIPE_STEPS: 'recipes/steps',
  FAVORITES: 'favorites',
  FEEDBACK: 'feedback',
  BANNERS: 'banners',
  CATEGORIES: 'categories',
  INGREDIENTS: 'ingredients',
  TMP: 'tmp',
} as const;

// 初始化 COS 客户端
const cos = new COS({
  SecretId: cosConfig.SecretId,
  SecretKey: cosConfig.SecretKey,
});

// 获取完整 URL
function getCOSUrl(key: string): string {
  return `${cosConfig.BaseUrl}/${key}`;
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

    return new Promise((resolve, reject) => {
      cos.putObject(
        {
          Bucket: cosConfig.Bucket,
          Region: cosConfig.Region,
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
    
    return new Promise((resolve, reject) => {
      cos.putObject(
        {
          Bucket: cosConfig.Bucket,
          Region: cosConfig.Region,
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
    
    return new Promise((resolve, reject) => {
      cos.putObject(
        {
          Bucket: cosConfig.Bucket,
          Region: cosConfig.Region,
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
   * 上传用户头像
   */
  static async uploadAvatar(buffer: Buffer, userId: string): Promise<{ url: string; key: string }> {
    const key = `${COS_FOLDERS.AVATARS}/user_${userId}/avatar_${Date.now()}.jpg`;
    
    return new Promise((resolve, reject) => {
      cos.putObject(
        {
          Bucket: cosConfig.Bucket,
          Region: cosConfig.Region,
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
    
    return new Promise((resolve, reject) => {
      cos.putObject(
        {
          Bucket: cosConfig.Bucket,
          Region: cosConfig.Region,
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
   * 上传分类图标
   */
  static async uploadCategoryIcon(buffer: Buffer, categoryId: string): Promise<{ url: string; key: string }> {
    const key = `${COS_FOLDERS.CATEGORIES}/${categoryId}/icon_${Date.now()}.png`;
    
    return new Promise((resolve, reject) => {
      cos.putObject(
        {
          Bucket: cosConfig.Bucket,
          Region: cosConfig.Region,
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
   * 删除文件
   */
  static async deleteFile(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      cos.deleteObject(
        {
          Bucket: cosConfig.Bucket,
          Region: cosConfig.Region,
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

export { getCOSUrl, COS_FOLDERS };
export default COSService;
