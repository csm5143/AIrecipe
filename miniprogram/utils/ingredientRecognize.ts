// 食材识别工具
import { recognizeIngredients, IngredientRecognitionResult } from './AIphoto'

// 导出接口类型
export type { IngredientRecognitionResult }

/**
 * 识别图片中的食材
 * @param imagePath 图片本地路径
 * @returns 识别到的食材列表
 */
export async function recognizeImage(imagePath: string): Promise<IngredientRecognitionResult[]> {
  return await recognizeIngredients(imagePath);
}
