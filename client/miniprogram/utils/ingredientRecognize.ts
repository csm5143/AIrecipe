/**
 * 食材识别模块
 * 调用后端 /v1/app/recognize 端点，
 * 使用后台激活的 AI Key（多模态模型）进行图片识别食材
 */
import { upload, post } from './httpApi/request';

export interface IngredientRecognitionResult {
  name: string;
  confidence: number;
  category?: string;
}

export interface RecognizeResult {
  imageUrl: string;
  ingredients: IngredientRecognitionResult[];
  model?: string;
  tokensUsed?: number;
}

/**
 * 上传图片到 COS，返回公开可访问的 URL
 */
async function uploadImageToCOS(filePath: string): Promise<string | null> {
  const result = await upload('/v1/upload/scan', filePath, 'file', { folder: 'ai-scan' });
  if (result.success && result.data?.url) {
    return result.data.url;
  }
  console.error('[recognizeImage] 上传图片失败:', result.message);
  return null;
}

/**
 * 从图片中识别食材
 * 自动处理上传 + 识别全流程
 * @param filePath 微信临时文件路径（wx.chooseMedia / wx.chooseImage 返回的路径）
 * @returns 识别到的食材列表
 */
export async function recognizeImage(filePath: string): Promise<IngredientRecognitionResult[]> {
  const imageUrl = await uploadImageToCOS(filePath);
  if (!imageUrl) {
    return [];
  }

  try {
    const result = await post<{
      ingredients: string[];
      model: string;
      tokensUsed: number;
    }>('/v1/app/recognize', { imageUrl }, { withToken: true });

    if (!result.success || !result.data) {
      console.error('[recognizeImage] 识别失败:', result.message);
      return [];
    }

    const { ingredients } = result.data;
    if (!ingredients || ingredients.length === 0) {
      return [];
    }

    return ingredients.map((name: string) => ({
      name: name.trim(),
      confidence: 0.8,
    }));
  } catch (err) {
    console.error('[recognizeImage] 请求异常:', err);
    return [];
  }
}

/**
 * 上传图片并识别食材，返回上传后的 URL
 * 用于扫描记录保存
 */
export async function uploadAndRecognize(filePath: string): Promise<RecognizeResult | null> {
  const imageUrl = await uploadImageToCOS(filePath);
  if (!imageUrl) return null;

  try {
    const result = await post<{
      ingredients: string[];
      model: string;
      tokensUsed: number;
    }>('/v1/app/recognize', { imageUrl }, { withToken: true });

    if (!result.success || !result.data) {
      console.error('[uploadAndRecognize] 识别失败:', result.message);
      return null;
    }

    const { ingredients, model, tokensUsed } = result.data;
    return {
      imageUrl,
      ingredients: (ingredients || []).map((name: string) => ({
        name: name.trim(),
        confidence: 0.8,
      })),
      model,
      tokensUsed,
    };
  } catch (err) {
    console.error('[uploadAndRecognize] 请求异常:', err);
    return null;
  }
}
