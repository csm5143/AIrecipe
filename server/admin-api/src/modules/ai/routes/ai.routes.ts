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
import { generateImage, getTemplates, generateRecipeCover, generateRecipeImageSet } from '../../../services/aiImage.service';
import { generateNoticeContent } from '../../../services/aiText.service';
import { success, badRequest, notFound } from '../../../types/response';
import { prisma } from '../../../lib/prisma';
import { COSService, COS_FOLDERS } from '../../../services/cos.service';
import { buildStorageKey } from '../../../utils/storageKey';

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
    const label = String(recipeTitle || targetType || 'ai-image');

    const rid = Number(recipeId) || 0;
    const si = Number(stepIndex) || 0;

    if (targetType === 'recipe-cover') {
      const baseKey = buildStorageKey({
        folder: COS_FOLDERS.RECIPE_COVER,
        segments: ['covers'],
        prefix: 'cover',
        label,
        ext: '.png',
      });
      const key = await COSService.uniqueKey(baseKey);
      cosResult = await COSService.uploadWithKey(buf, key);
      if (rid) {
        await prisma.recipe.update({
          where: { id: rid },
          data: { coverImage: cosResult.url },
        });
      }
    } else if (targetType === 'recipe-step') {
      const baseKey = buildStorageKey({
        folder: COS_FOLDERS.RECIPE_STEPS,
        segments: [label],
        prefix: 'step',
        label,
        stepIndex: si,
        ext: '.png',
      });
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
      const key = await COSService.uniqueKey(buildStorageKey({ folder: COS_FOLDERS.BANNERS, prefix: targetType, label, ext: '.png' }));
      cosResult = await COSService.uploadWithKey(buf, key);
    } else {
      const key = await COSService.uniqueKey(buildStorageKey({ folder: COS_FOLDERS.AI_GENERATED, segments: ['adopted'], prefix: 'ai', label, ext: '.png' }));
      cosResult = await COSService.uploadWithKey(buf, key);
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

// ===================== 批量生成整套菜谱图 =====================
router.post('/recipe-image-set', asyncHandler(contentRole), asyncHandler(async (req, res) => {
  const { recipeId, templateId, overwrite, autoApply, styleNotes, aiKeyId } = req.body;
  if (!recipeId) {
    res.status(400).json(badRequest('缺少 recipeId'));
    return;
  }
  try {
    const result = await generateRecipeImageSet(
      Number(recipeId),
      Number(templateId || 0),
      { overwrite: overwrite !== false, autoApply: autoApply === true, styleNotes, aiKeyId: aiKeyId ? Number(aiKeyId) : undefined },
    );
    res.json(success(result, result.success ? '生成完成' : '部分生成失败'));
  } catch (e: any) {
    res.status(500).json(badRequest(e.message || '批量生成失败'));
  }
}));

// SSE 流式生成整套图：每张图完成即刻推送
router.post('/recipe-image-set-stream', asyncHandler(contentRole), async (req, res) => {
  const { recipeId, templateId, overwrite, styleNotes, aiKeyId } = req.body;
  if (!recipeId) {
    res.status(400).json(badRequest('缺少 recipeId'));
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const send = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // Import the internal function to stream results
    const { generateRecipeImageSetStream } = await import('../../../services/aiImage.service');
    await generateRecipeImageSetStream(
      Number(recipeId),
      Number(templateId || 0),
      { overwrite: overwrite !== false, styleNotes, aiKeyId: aiKeyId ? Number(aiKeyId) : undefined },
      send,
    );
    send({ type: 'done' });
  } catch (e: any) {
    send({ type: 'error', error: e?.message || '生成失败' });
  } finally {
    res.end();
  }
});

// 重试单张套图（失败后点击重试）
router.post('/retry-set-image', asyncHandler(contentRole), asyncHandler(async (req, res) => {
  const { recipeId, stepIndex, templateId, styleNotes, aiKeyId } = req.body;
  if (!recipeId) { res.status(400).json(badRequest('缺少 recipeId')); return; }
  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: Number(recipeId) },
      select: { id: true, title: true, category: true, ingredients: true, steps: true },
    });
    if (!recipe) { res.status(404).json(notFound('菜谱不存在')); return; }

    const idx = Number(stepIndex);
    const steps = (recipe.steps as any[]) || [];
    const ingNames = ((recipe.ingredients as any[]) || []).slice(0, 5).map((i: any) => i.name || i).filter(Boolean).join('、') || '新鲜食材';
    const notes = (styleNotes || '温暖自然光，美食摄影风格').toString();
    const size = templateId > 0 ? ((await prisma.promptTemplate.findFirst({ where: { id: Number(templateId) } }))?.size || '1024x1024') : '1024x1024';

    let prompt: string;
    if (idx < 0) {
      prompt = `【${recipe.title}】成品摆盘照片。${notes}。`;
    } else {
      const step = steps[idx];
      const content = typeof step === 'string' ? step : (step.content || step.description || `步骤${idx + 1}`);
      prompt = `【${recipe.title}】制作步骤${idx + 1}/${steps.length}: ${content}。${notes}。`;
    }

    const result = await generateImage({
      templateId: String(templateId || 0), dishName: recipe.title,
      ingredients: ingNames, plateStyle: idx < 0 ? '质朴陶瓷盘' : '厨房灶台',
      stepDescription: idx >= 0 ? `步骤${idx + 1}` : '', prompt, size,
      aiKeyId: aiKeyId ? Number(aiKeyId) : undefined,
      storage: {
        folder: COS_FOLDERS.AI_GENERATED,
        segments: ['recipes', recipe.title, idx < 0 ? 'covers' : 'steps'],
        prefix: idx < 0 ? 'ai-cover' : 'ai-step',
        label: recipe.title,
        ...(idx >= 0 ? { stepIndex: idx } : {}),
      },
    });
    res.json(success(result));
  } catch (e: any) {
    res.status(500).json(badRequest(e.message || '重试失败'));
  }
}));

// 批量应用整套图：从 ai-generated 复制到 recipes/ 和 recipes/steps/
router.post('/adopt-image-set', asyncHandler(contentRole), asyncHandler(async (req, res) => {
  const { recipeId, coverUrl, stepImages } = req.body as {
    recipeId: number;
    coverUrl?: string;
    stepImages?: Array<{ stepIndex: number; imageUrl: string }>;
  };

  if (!recipeId) { res.status(400).json(badRequest('缺少 recipeId')); return; }

  const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
  if (!recipe) { res.status(404).json(notFound('菜谱不存在')); return; }

  const label = String(recipe.title || 'recipe');
  const results: any = { coverUrl: '', stepImages: [], errors: [] as any[] };

  try {
    // Copy cover image
    if (coverUrl) {
      try {
        const resp = await fetch(coverUrl);
        if (!resp.ok) throw new Error('下载封面失败');
        const buf = Buffer.from(await resp.arrayBuffer());
        const key = await COSService.uniqueKey(buildStorageKey({
          folder: COS_FOLDERS.RECIPE_COVER,
          segments: ['covers'],
          prefix: 'cover',
          label,
          ext: '.png',
        }));
        const upload = await COSService.uploadWithKey(buf, key);
        results.coverUrl = upload.url;
      } catch (e: any) {
        results.errors.push({ stepIndex: -1, error: e.message });
      }
    }

    // Copy step images
    const steps = Array.isArray(recipe.steps) ? [...recipe.steps] as any[] : [];
    if (stepImages?.length) {
      for (const si of stepImages) {
        try {
          const resp = await fetch(si.imageUrl);
          if (!resp.ok) throw new Error(`下载步骤${si.stepIndex + 1}失败`);
          const buf = Buffer.from(await resp.arrayBuffer());
          const key = await COSService.uniqueKey(buildStorageKey({
            folder: COS_FOLDERS.RECIPE_STEPS,
            segments: [label],
            prefix: 'step',
            label,
            stepIndex: si.stepIndex,
            ext: '.png',
          }));
          const upload = await COSService.uploadWithKey(buf, key);
          results.stepImages.push({ stepIndex: si.stepIndex, imageUrl: upload.url });
          if (steps[si.stepIndex]) {
            const obj = typeof steps[si.stepIndex] === 'string'
              ? { content: steps[si.stepIndex] } : { ...steps[si.stepIndex] };
            obj.image = upload.url;
            obj.imageUrl = upload.url;
            steps[si.stepIndex] = obj;
          }
        } catch (e: any) {
          results.errors.push({ stepIndex: si.stepIndex, error: e.message });
        }
      }
    }

    // Update recipe
    const updateData: any = { steps };
    if (results.coverUrl) updateData.coverImage = results.coverUrl;
    await prisma.recipe.update({ where: { id: recipeId }, data: updateData });

    res.json(success(results, '已应用'));
  } catch (e: any) {
    res.status(500).json(badRequest(e.message || '应用失败'));
  }
}));

export default router;
