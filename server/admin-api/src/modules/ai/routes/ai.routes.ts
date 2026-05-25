/**
 * AI 辅助功能路由
 * POST /ai/generate-image  — 图片生成
 * POST /ai/generate-text   — 文本生成
 * GET  /ai/templates       — 获取 Prompt 模板
 * POST /ai/recipe-cover    — 生成菜谱封面（生成+自动更新菜谱）
 */
import { Router, Router as ExpressRouter } from 'express';
import { asyncHandler } from '../../../utils/helper';
import { authenticate, authorize } from '../../auth/middleware/auth.middleware';
import { generateImage, getTemplates, generateRecipeCover } from '../../../services/aiImage.service';
import { generateNoticeContent } from '../../../services/aiText.service';
import { success, badRequest } from '../../../types/response';

const router: ExpressRouter = Router();
router.use(asyncHandler(authenticate));

// 查看/编辑内容需要 ADMIN 以上
const contentRole = authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR');

// 获取所有 Prompt 模板
router.get('/templates', asyncHandler(contentRole), asyncHandler(async (_req, res) => {
  res.json(success(getTemplates()));
}));

// AI 图片生成
router.post('/generate-image', asyncHandler(contentRole), asyncHandler(async (req, res) => {
  const { templateId, dishName, ingredients, plateStyle, stepDescription, size } = req.body;
  if (!templateId) {
    res.status(400).json(badRequest('缺少 templateId'));
    return;
  }
  const result = await generateImage({ templateId, dishName, ingredients, plateStyle, stepDescription, size });
  if (!result.success) {
    res.status(400).json(badRequest(result.error || '生成失败'));
    return;
  }
  res.json(success({ url: result.cosUrl }, '图片已生成'));
}));

// AI 生成 + 自动更新菜谱封面
router.post('/recipe-cover', asyncHandler(contentRole), asyncHandler(async (req, res) => {
  const { recipeId, templateId } = req.body;
  if (!recipeId || !templateId) {
    res.status(400).json(badRequest('缺少 recipeId 或 templateId'));
    return;
  }
  const result = await generateRecipeCover(Number(recipeId), templateId);
  if (!result.success) {
    res.status(400).json(badRequest(result.error || '生成失败'));
    return;
  }
  res.json(success({ url: result.cosUrl }, '封面已生成并更新'));
}));

// AI 文本生成（公告等）
router.post('/generate-text', asyncHandler(contentRole), asyncHandler(async (req, res) => {
  const { topic, length } = req.body;
  if (!topic) {
    res.status(400).json(badRequest('缺少 topic（创作主题）'));
    return;
  }
  try {
    const content = await generateNoticeContent(topic, length || 'medium');
    res.json(success({ content }, '文案已生成'));
  } catch (e: any) {
    res.status(500).json(badRequest(e.message || '生成失败'));
  }
}));

export default router;
