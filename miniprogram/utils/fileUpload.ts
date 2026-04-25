/**
 * 文件上传到云存储工具
 * 使用云函数上传头像到 COS，反馈图片到 feedback 文件夹
 */

import { COS_CONFIG, COS_FOLDERS, getCOSUrl as getCOSUrlFromCos } from './cos';

// 云函数返回结果类型
interface CloudFunctionResult {
  success?: boolean;
  data?: {
    url?: string;
    urls?: string[];
    [key: string]: any;
  };
  [key: string]: any;
}

// 云函数调用返回类型（宽松定义，兼容微信原生类型）
interface CloudCallResult {
  errMsg?: string;
  result?: CloudFunctionResult | string | any;
  [key: string]: any;
}

/**
 * 上传用户头像到 COS
 * @param fileBuffer 文件内容的 Base64 数据
 * @returns 上传后的 URL
 */
export async function uploadAvatarToCOS(fileBuffer: string): Promise<string | null> {
  try {
    const result = await wx.cloud.callFunction({
      name: 'uploadAvatar',
      data: {
        action: 'uploadAvatar',
        data: {
          fileBuffer: fileBuffer
        }
      }
    });

    const resData = (result as any).result;
    if (resData && resData.success) {
      const data = resData.data;
      const url = (data && data.url) ? data.url : null;
      console.log('[FileUpload] 头像上传成功:', url);
      return url;
    } else {
      console.error('[FileUpload] 头像上传失败:', resData || result);
      return null;
    }
  } catch (e) {
    console.error('[FileUpload] 头像上传异常:', e);
    return null;
  }
}

/**
 * 上传收藏夹封面到 COS (favorites 文件夹)
 * @param fileBuffer 文件内容的 Base64 数据
 * @returns 上传后的 URL
 */
export async function uploadFavoriteCoverToCOS(fileBuffer: string): Promise<string | null> {
  try {
    const result = await wx.cloud.callFunction({
      name: 'uploadAvatar',
      data: {
        action: 'uploadFavoriteCover',
        data: {
          fileBuffer: fileBuffer
        }
      }
    });

    const resData = (result as any).result;
    if (resData && resData.success) {
      const data = resData.data;
      const url = (data && data.url) ? data.url : null;
      console.log('[FileUpload] 收藏夹封面上传成功:', url);
      return url;
    } else {
      console.error('[FileUpload] 收藏夹封面上传失败:', resData || result);
      return null;
    }
  } catch (e) {
    console.error('[FileUpload] 收藏夹封面上传异常:', e);
    return null;
  }
}

/**
 * 上传反馈图片到 COS
 * @param imageBuffers 图片 Base64 数组
 * @returns 上传后的 URL 数组
 */
export async function uploadFeedbackImagesToCOS(imageBuffers: string[]): Promise<string[]> {
  if (!imageBuffers || imageBuffers.length === 0) {
    return [];
  }

  try {
    const result = await wx.cloud.callFunction({
      name: 'uploadAvatar',
      data: {
        action: 'uploadFeedbackImages',
        data: {
          images: imageBuffers.map((buffer, index) => ({
            fileBuffer: buffer,
            fileName: `image_${index}.jpg`
          }))
        }
      }
    });

    const resData = (result as any).result;
    if (resData && resData.success) {
      const data = resData.data;
      const urls = (data && data.urls) ? data.urls : [];
      console.log('[FileUpload] 反馈图片上传成功:', urls);
      return urls;
    } else {
      console.error('[FileUpload] 反馈图片上传失败:', resData || result);
      return [];
    }
  } catch (e) {
    console.error('[FileUpload] 反馈图片上传异常:', e);
    return [];
  }
}

/**
 * 选择图片并转换为 Base64
 * @param count 选择数量
 * @returns Base64 数组
 */
export function chooseImageAsBase64(count: number = 1): Promise<string[]> {
  return new Promise((resolve, reject) => {
    wx.chooseImage({
      count: count,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePaths = res.tempFilePaths;
        const base64Promises: Promise<string>[] = tempFilePaths.map((path: string) => {
          return new Promise<string>((resImg) => {
            wx.getFileSystemManager().readFile({
              filePath: path,
              encoding: 'base64',
              success: (readRes) => {
                resImg(readRes.data as string);
              },
              fail: (err) => {
                console.error('[FileUpload] 读取文件失败:', err);
                resImg('');
              }
            });
          });
        });

        Promise.all(base64Promises)
          .then((results) => {
            resolve(results.filter((b) => b.length > 0));
          })
          .catch((e) => {
            reject(e);
          });
      },
      fail: (err) => {
        console.error('[FileUpload] 选择图片失败:', err);
        reject(err);
      }
    });
  });
}

/**
 * 获取云存储图片的 COS URL
 * @param fileID 云存储文件 ID
 * @returns COS 完整 URL
 */
export function getCOSUrl(fileID: string): string {
  return getCOSUrlFromCos(fileID);
}

export { COS_CONFIG, COS_FOLDERS };

/**
 * 测试云函数签名（调试用）
 */
export async function testCOSSignature(): Promise<any> {
  try {
    const result = await wx.cloud.callFunction({
      name: 'uploadAvatar',
      data: {
        action: 'testSignature',
        data: {
          testKey: 'test/debug.jpg'
        }
      }
    });
    console.log('[FileUpload] 签名测试结果:', result);
    return result;
  } catch (e) {
    console.error('[FileUpload] 签名测试异常:', e);
    return null;
  }
}
