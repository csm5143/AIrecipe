/**
 * 腾讯云 COS 配置
 * 管理后台与三端统一配置
 */

export const cosConfig = {
  // 存储桶信息
  Bucket: 'dish-1367781796',
  Region: 'ap-guangzhou',
  BaseUrl: 'https://dish-1367781796.cos.ap-guangzhou.myqcloud.com',

  // 文件夹类型
  folders: {
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
  } as const,
};

/**
 * COS 文件夹类型
 */
export type COSFolderType = keyof typeof cosConfig.folders;

/**
 * 生成完整的 COS URL
 */
export function getCOSUrl(key: string): string {
  if (!key) return '';
  if (key.startsWith('http')) return key;
  return `${cosConfig.BaseUrl}/${key}`;
}

/**
 * 从 URL 中提取 COS key
 */
export function extractCOSKey(url: string): string | null {
  if (!url) return null;
  if (!url.includes(cosConfig.BaseUrl)) return null;
  return url.replace(`${cosConfig.BaseUrl}/`, '');
}

/**
 * 生成上传文件名
 */
export function generateFileName(ext: string = '.jpg'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}_${random}${ext}`;
}

export default cosConfig;
