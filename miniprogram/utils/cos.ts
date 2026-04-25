/**
 * 腾讯云 COS 配置
 * 三端统一配置
 */

export const COS_CONFIG = {
  Bucket: 'dish-1367781796',
  Region: 'ap-guangzhou',
  BaseUrl: 'https://dish-1367781796.cos.ap-guangzhou.myqcloud.com',
};

export const COS_FOLDERS = {
  AVATARS: 'avatars',
  RECIPES: 'recipes',
  RECIPE_STEPS: 'recipes/steps',
  FAVORITES: 'favorites',
  FEEDBACK: 'feedback',
  BANNERS: 'banners',
  CATEGORIES: 'categories',
  INGREDIENTS: 'ingredients',
  TMP: 'tmp',
} as const;

export type COSFolderKey = keyof typeof COS_FOLDERS;

/**
 * 获取完整的 COS URL
 */
export function getCOSUrl(key: string): string {
  if (!key) return '';
  if (key.startsWith('http')) return key;
  return `${COS_CONFIG.BaseUrl}/${key}`;
}

/**
 * 从 URL 中提取 COS key
 */
export function extractCOSKey(url: string): string | null {
  if (!url) return null;
  if (!url.includes(COS_CONFIG.BaseUrl)) return null;
  return url.replace(`${COS_CONFIG.BaseUrl}/`, '');
}

/**
 * 生成上传文件名
 */
export function generateFileName(ext: string = '.jpg'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}_${random}${ext}`;
}
