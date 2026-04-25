/**
 * 上传文件到腾讯云 COS
 * 支持：头像、收藏夹封面、反馈图片
 */

const cloud = require('wx-server-sdk');
const COS = require('cos-nodejs-sdk-v5');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// COS 配置
const cosConfig = {
  SecretId: process.env.TENCENT_CLOUD_SECRET_ID || '',
  SecretKey: process.env.TENCENT_CLOUD_SECRET_KEY || '',
  Bucket: 'dish-1367781796',
  Region: 'ap-guangzhou',
};

const cos = new COS({
  SecretId: cosConfig.SecretId,
  SecretKey: cosConfig.SecretKey,
});

/**
 * 生成文件名
 * @param {string} prefix 文件夹前缀
 * @param {string} ext 扩展名
 * @returns {string} 完整路径
 */
function generateFileName(prefix, ext) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}/${timestamp}_${random}${ext}`;
}

/**
 * 上传单个文件到 COS
 * @param {Buffer|string} fileContent 文件内容
 * @param {string} key COS 路径
 * @returns {Promise<{url: string, key: string}>}
 */
function uploadToCOS(fileContent, key) {
  return new Promise((resolve, reject) => {
    cos.putObject(
      {
        Bucket: cosConfig.Bucket,
        Region: cosConfig.Region,
        Key: key,
        Body: fileContent,
        ContentLength: Buffer.isBuffer(fileContent) ? fileContent.length : Buffer.from(fileContent, 'base64').length,
      },
      (err, data) => {
        if (err) {
          console.error('[COS] 上传失败:', err);
          reject(err);
        } else {
          const url = `https://${cosConfig.Bucket}.cos.${cosConfig.Region}.myqcloud.com/${key}`;
          resolve({ url, key });
        }
      }
    );
  });
}

/**
 * Base64 字符串转 Buffer
 */
function base64ToBuffer(base64Str) {
  // 移除 data URI 前缀
  const base64Data = base64Str.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}

/**
 * 获取文件扩展名
 */
function getExtensionFromBase64(base64Str) {
  const match = base64Str.match(/^data:image\/(\w+);base64,/);
  return match ? `.${match[1]}` : '.jpg';
}

/**
 * 主入口
 */
exports.main = async (event, context) => {
  const { action, data } = event;

  try {
    // 测试签名
    if (action === 'testSignature') {
      return {
        success: true,
        message: 'COS 配置正常',
        config: {
          Bucket: cosConfig.Bucket,
          Region: cosConfig.Region,
          hasCredentials: !!(cosConfig.SecretId && cosConfig.SecretKey),
        },
      };
    }

    // 上传头像
    if (action === 'uploadAvatar') {
      const { fileBuffer } = data;
      if (!fileBuffer) {
        return { success: false, message: '缺少文件内容' };
      }
      const buffer = base64ToBuffer(fileBuffer);
      const ext = getExtensionFromBase64(fileBuffer);
      const key = generateFileName('avatars', ext);
      const result = await uploadToCOS(buffer, key);
      return {
        success: true,
        data: { url: result.url, key },
      };
    }

    // 上传收藏夹封面
    if (action === 'uploadFavoriteCover') {
      const { fileBuffer } = data;
      if (!fileBuffer) {
        return { success: false, message: '缺少文件内容' };
      }
      const buffer = base64ToBuffer(fileBuffer);
      const ext = getExtensionFromBase64(fileBuffer);
      const key = generateFileName('favorites', ext);
      const result = await uploadToCOS(buffer, key);
      return {
        success: true,
        data: { url: result.url, key },
      };
    }

    // 上传反馈图片
    if (action === 'uploadFeedbackImages') {
      const { images } = data;
      if (!images || images.length === 0) {
        return { success: false, message: '缺少图片' };
      }
      const uploadPromises = images.map(async (img, index) => {
        const buffer = base64ToBuffer(img.fileBuffer);
        const ext = getExtensionFromBase64(img.fileBuffer);
        const key = generateFileName(`feedback/${Date.now()}`, ext);
        const result = await uploadToCOS(buffer, key);
        return result.url;
      });
      const urls = await Promise.all(uploadPromises);
      return {
        success: true,
        data: { urls },
      };
    }

    // 上传菜谱图片
    if (action === 'uploadRecipeImage') {
      const { fileBuffer, recipeId, type } = data;
      if (!fileBuffer) {
        return { success: false, message: '缺少文件内容' };
      }
      const buffer = base64ToBuffer(fileBuffer);
      const ext = getExtensionFromBase64(fileBuffer);
      const folder = type === 'cover' ? 'recipes' : 'recipes/steps';
      const key = `${folder}/${recipeId || 'tmp'}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
      const result = await uploadToCOS(buffer, key);
      return {
        success: true,
        data: { url: result.url, key },
      };
    }

    return { success: false, message: '未知操作' };
  } catch (error) {
    console.error('[COS] 错误:', error);
    return {
      success: false,
      message: error.message || '上传失败',
      error: error.stack,
    };
  }
};
