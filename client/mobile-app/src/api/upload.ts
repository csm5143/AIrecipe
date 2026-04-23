/**
 * 文件上传相关 API
 */
import { uploadFile } from './request';

// 上传图片
export function uploadImage(filePath: string, type: 'avatar' | 'recipe' | 'feedback' = 'recipe') {
  return uploadFile<ApiResponse<{ url: string; filename: string; size: number }>>('/upload/image', {
    filePath,
    name: 'image',
    formData: { type },
  });
}

// 上传多张图片
export function uploadImages(filePaths: string[], type: 'avatar' | 'recipe' | 'feedback' = 'recipe') {
  return Promise.all(
    filePaths.map((path) => uploadImage(path, type))
  );
}
