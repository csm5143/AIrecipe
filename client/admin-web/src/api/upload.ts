/**
 * 文件上传 API
 * 支持本地上传和腾讯云 COS
 */

import request from './request';
import { cosConfig } from '../utils/cos';

export interface UploadResponse {
  url: string;
  key: string;
  filename: string;
  size: number;
  storage: 'cos' | 'local';
}

/**
 * 上传文件到服务器（通过服务端转发到 COS）
 * @param file 文件对象
 * @param folder 上传到的文件夹类型
 */
export async function uploadFile(file: File, folder: keyof typeof cosConfig.folders = 'TMP'): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', cosConfig.folders[folder]);

  const response = await request.post<any, { data: UploadResponse }>('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000, // 上传文件需要更长的超时时间
  });

  return response.data.data;
}

/**
 * 上传菜谱封面
 */
export async function uploadRecipeCover(file: File, recipeId?: string): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', cosConfig.folders.RECIPE_COVER);
  if (recipeId) {
    formData.append('recipeId', recipeId);
  }

  const response = await request.post<any, { data: UploadResponse }>('/upload/recipe-cover', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000,
  });

  return response.data.data;
}

/**
 * 上传菜谱步骤图
 */
export async function uploadRecipeStep(file: File, recipeId: string, stepIndex: number): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', cosConfig.folders.RECIPE_STEPS);
  formData.append('recipeId', recipeId);
  formData.append('stepIndex', String(stepIndex));

  const response = await request.post<any, { data: UploadResponse }>('/upload/recipe-step', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000,
  });

  return response.data.data;
}

/**
 * 上传 Banner 图片
 */
export async function uploadBanner(file: File): Promise<UploadResponse> {
  return uploadFile(file, 'BANNERS');
}

/**
 * 上传分类图标
 */
export async function uploadCategoryIcon(file: File, categoryId?: string): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', cosConfig.folders.CATEGORIES);
  if (categoryId) {
    formData.append('categoryId', categoryId);
  }

  const response = await request.post<any, { data: UploadResponse }>('/upload/category-icon', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000,
  });

  return response.data.data;
}
