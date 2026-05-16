/**
 * 腾讯云 COS 配置
 * 三端统一存储配置
 */

// COS 配置
export const cosConfig = {
  SecretId: process.env.TENCENT_COS_SECRET_ID || '',
  SecretKey: process.env.TENCENT_COS_SECRET_KEY || '',
  Bucket: process.env.TENCENT_COS_BUCKET || 'dish-1367781796',
  Region: process.env.TENCENT_COS_REGION || 'ap-guangzhou',
  BaseUrl: process.env.TENCENT_COS_BASE_URL || 'https://dish-1367781796.cos.ap-guangzhou.myqcloud.com',
};

// 文件夹类型
export const COS_FOLDERS = {
  AVATARS: 'avatars',           // 用户头像
  RECIPES: 'recipes',           // 菜谱图片
  RECIPE_COVER: 'recipes',      // 菜谱封面
  RECIPE_STEPS: 'recipes/steps', // 菜谱步骤图
  FAVORITES: 'favorites',       // 收藏夹封面
  FEEDBACK: 'feedback',         // 用户反馈
  BANNERS: 'banners',           // Banner轮播图
  CATEGORIES: 'categories',     // 分类图标
  INGREDIENTS: 'ingredients',   // 食材图片
  TMP: 'tmp',                   // 临时文件
} as const;

export type COSFolderType = typeof COS_FOLDERS[keyof typeof COS_FOLDERS];

/**
 * 生成 COS 文件路径
 */
export function generateCOSKey(folder: COSFolderType, fileName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')) : '.jpg';
  return `${folder}/${timestamp}_${random}${ext}`;
}

/**
 * 获取完整的 COS URL
 */
export function getCOSUrl(key: string): string {
  return `${cosConfig.BaseUrl}/${key}`;
}

export default cosConfig;
