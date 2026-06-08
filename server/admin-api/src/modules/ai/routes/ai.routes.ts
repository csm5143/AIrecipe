/**
 * AI 辅助功能路由
 * POST /ai/generate-image   — 图片生成
 * POST /ai/generate-text    — 文本生成
 * GET  /ai/templates        — 获取 Prompt 模板列表
 * POST /ai/templates        — 创建模板
 * PUT  /ai/templates/:id    — 更新模板
 * DEL  /ai/templates/:id    — 删除模板
 * POST /ai/recipe-cover     — 生成菜谱封面（生成+自动更新菜谱）
 */
import { Router, Router as ExpressRouter } from 'express';
import { asyncHandler } from '../../../utils/helper';
import { authenticate, authorize } from '../../auth/middleware/auth.middleware';
import { generateImage, getTemplates, generateRecipeCover } from '../../../services/aiImage.service';
import { generateNoticeContent } from '../../../services/aiText.service';
import { success, badRequest, notFound } from '../../../types/response';
import { prisma } from '../../../lib/prisma';
import { COSService, COS_FOLDERS } from '../../../services/cos.service';

const router: ExpressRouter = Router();
router.use(asyncHandler(authenticate));

// 查看/编辑内容需要 ADMIN 以上
const contentRole = authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR');

// ===================== 模板管理 =====================

// 获取所有 Prompt 模板（需登录即可查看）
router.get('/templates', asyncHandler(async (_req, res) => {
  const templates = await getTemplates();
  res.json(success(templates));
}));

// 创建模板
router.post('/templates', asyncHandler(contentRole), asyncHandler(async (req, res) => {
  const { name, description, scene, template, size, sortOrder } = req.body;
  if (!name || !scene || !template) {
    res.status(400).json(badRequest('缺少必填字段：name, scene, template'));
    return;
  }
  const created = await prisma.promptTemplate.create({
    data: {
      name,
      description: description || null,
      scene,
      template,
      size: size || '1024x1024',
      sortOrder: sortOrder || 0,
    },
  });
  res.json(success(created, '模板创建成功'));
}));

// 更新模板
router.put('/templates/:id', asyncHandler(contentRole), asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const existing = await prisma.promptTemplate.findUnique({ where: { id } });
  if (!existing) { res.status(404).json(notFound('模板不存在')); return; }

  const { name, description, scene, template, size, sortOrder, isActive } = req.body;
  const data: any = {};
  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description;
  if (scene !== undefined) data.scene = scene;
  if (template !== undefined) data.template = template;
  if (size !== undefined) data.size = size;
  if (sortOrder !== undefined) data.sortOrder = sortOrder;
  if (isActive !== undefined) data.isActive = isActive;

  const updated = await prisma.promptTemplate.update({ where: { id }, data });
  res.json(success(updated, '模板更新成功'));
}));

// 删除模板
router.delete('/templates/:id', asyncHandler(contentRole), asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const existing = await prisma.promptTemplate.findUnique({ where: { id } });
  if (!existing) { res.status(404).json(notFound('模板不存在')); return; }

  await prisma.promptTemplate.delete({ where: { id } });
  res.json(success(null, '模板已删除'));
}));

// ===================== AI 生成 =====================

// AI 图片生成
router.post('/generate-image', asyncHandler(contentRole), asyncHandler(async (req, res) => {
  const { templateId, dishName, ingredients, plateStyle, stepDescription, size, prompt, aiKeyId, model, refImage } = req.body;
  if (templateId === undefined || templateId === null || templateId === '') {
    res.status(400).json(badRequest('缺少 templateId'));
    return;
  }
  const result = await generateImage({ templateId, dishName, ingredients, plateStyle, stepDescription, size, prompt, aiKeyId, model, refImage });
  if (!result.success) {
    res.status(400).json(badRequest(result.error || '生成失败'));
    return;
  }
  res.json(success({ url: result.cosUrl }, '图片已生成'));
}));

// 应用 AI 生成的图片：从 ai-generated 复制到对应文件夹并更新菜谱
router.post('/adopt-image', asyncHandler(contentRole), asyncHandler(async (req, res) => {
  const { sourceUrl, targetType, recipeId, recipeTitle, stepIndex } = req.body;
  if (!sourceUrl) {
    res.status(400).json(badRequest('缺少 sourceUrl'));
    return;
  }
  try {
    // 下载源图片
    const resp = await fetch(sourceUrl);
    if (!resp.ok) throw new Error('下载源图片失败');
    const buf = Buffer.from(await resp.arrayBuffer());

    // 根据目标类型上传到对应 COS 文件夹
    let cosResult: { url: string; key: string };
    const safeName = (recipeTitle || 'recipe').replace(/[\/\\:*?"<>|]/g, '_').slice(0, 40);

    const rid = Number(recipeId) || 0;
    const si = Number(stepIndex) || 0;

    if (targetType === 'recipe-cover') {
      const baseKey = `${COS_FOLDERS.RECIPE_COVER}/${safeName}.png`;
      const key = await COSService.uniqueKey(baseKey);
      cosResult = await COSService.uploadWithKey(buf, key);
      if (rid) {
        await prisma.recipe.update({
          where: { id: rid },
          data: { coverImage: cosResult.url },
        });
      }
    } else if (targetType === 'recipe-step') {
      const baseKey = `${COS_FOLDERS.RECIPE_STEPS}/step_${si}_${safeName}.png`;
      const key = await COSService.uniqueKey(baseKey);
      cosResult = await COSService.uploadWithKey(buf, key);
      if (rid && stepIndex >= 0) {
        const recipe = await prisma.recipe.findUnique({ where: { id: rid } });
        if (recipe) {
          const steps = [...(recipe.steps as any[] || [])];
          if (steps[stepIndex]) {
            steps[stepIndex] = { ...steps[stepIndex], image: cosResult.url };
            await prisma.recipe.update({
              where: { id: rid },
              data: { steps },
            });
          }
        }
      }
    } else if (targetType === 'banner' || targetType === 'card') {
      cosResult = await COSService.uploadWithKey(buf, `${COS_FOLDERS.BANNERS}/${targetType}_${safeName}.png`);
    } else {
      cosResult = await COSService.uploadWithKey(buf, `${COS_FOLDERS.AI_GENERATED}/${safeName}.png`);
    }

    res.json(success({ url: cosResult.url }, '图片已应用'));
  } catch (e: any) {
    res.status(500).json(badRequest(e.message || '应用失败'));
  }
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
