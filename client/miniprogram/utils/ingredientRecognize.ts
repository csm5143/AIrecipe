/**
 * 食材识别（stub - 云开发移除后暂不提供 AI 识别功能）
 * 保留接口签名，后续可接入第三方 OCR/AI 食材识别服务
 */

export interface IngredientRecognitionResult {
  name: string;
  confidence: number;
  category?: string;
}

/**
 * 从图片中识别食材（stub 版本）
 * @param _imagePath 临时文件路径
 * @returns 空结果，云开发移除后此功能暂停
 */
export async function recognizeImage(_imagePath: string): Promise<IngredientRecognitionResult[]> {
  console.warn('[IngredientRecognize] AI 食材识别功能当前不可用，请手动输入食材');
  return [];
}
