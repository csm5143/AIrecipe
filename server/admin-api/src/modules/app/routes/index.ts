import { Router, Router as ExpressRouter } from 'express';
import recipeRoutes from './recipe.routes';
import favoriteRoutes from './favorite.routes';
import contentRoutes from './content.routes';
import ingredientRoutes from './ingredient.routes';
import { asyncHandler } from '../../../utils/helper';
import { wxAuthenticate } from '../../wx/middleware/wxAuth.middleware';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { prisma } from '../../../lib/prisma';
import { success, badRequest } from '../../../types/response';
import { logAiUsage } from '../../../services/aiUsageLog.service';
import { normalizeRecognizedIngredients, saveIngredientRecognitionLog } from '../../../services/ingredientRecognition.service';

const router: ExpressRouter = Router();

router.use('/recipes', recipeRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/content', contentRoutes);
router.use('/ingredients', ingredientRoutes);

// ============ AI 食材识别（小程序端）============
// POST /api/v1/app/recognize
// 使用当前激活的 AI Key 进行多模态图片识别
router.post('/recognize', wxAuthenticate, asyncHandler(async (req, res) => {
  const userId = (req as any).userId as number;
  const { imageUrl } = req.body as { imageUrl?: string };

  if (!imageUrl) {
    res.status(400).json(badRequest('图片地址不能为空'));
    return;
  }

  // 获取食材识别专用 AI Key（vision 类型，兼容旧数据）
  const activeKey = await prisma.aiApiKey.findFirst({
    where: {
      isActive: true,
      AND: [
        { OR: [{ usage: 'vision' }, { usage: null }] },
        { OR: [{ keyType: { in: ['multimodal', 'text'] } }, { keyType: null }] },
      ],
    },
    orderBy: [{ usage: 'asc' }], // 'vision' < null, prefer vision
  });

  if (!activeKey) {
    res.status(503).json(badRequest('暂无可用的 AI Key，请联系管理员配置'));
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { nickname: true, phone: true, email: true, openid: true },
  });
  const userName = user?.nickname || user?.phone || user?.email || user?.openid || `用户${userId}`;
  const start = Date.now();

  // 调用 AI 多模态模型识别食材
  let rawResponse: any;
  let usage: any;
  try {
    const messages = [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageUrl } },
          {
            type: 'text',
            text: '请仔细观察这张图片中的所有食材，只返回 JSON 数组，不要返回其他说明。数组元素格式：{"name":"食材名","amount":"估计数量，可空","unit":"单位，可空","category":"meat|vegetable|staple|egg_dairy|seasoning|fruit|other","confidence":0.0到1.0}。只列出能清楚看到的食材。'
          },
        ],
      },
    ];

    const aiRes = await fetch(`${activeKey.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activeKey.apiKey}`,
      },
      body: JSON.stringify({
        model: activeKey.model,
        messages,
        max_tokens: 500,
        temperature: 0.1,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error('[Recognize] AI API error:', aiRes.status, errText);
      void logAiUsage({
        apiKeyId: activeKey.id,
        model: activeKey.model,
        usage: 'vision',
        purpose: '食材识别',
        userId,
        userName,
        input: imageUrl,
        duration: Date.now() - start,
        success: false,
        error: `AI 服务返回错误 ${aiRes.status}: ${errText.slice(0, 200)}`,
      });
      res.status(502).json(badRequest(`AI 服务返回错误: ${aiRes.status}`));
      return;
    }

    rawResponse = await aiRes.json();
    usage = rawResponse.usage;
    const content = rawResponse.choices?.[0]?.message?.content || '';

    const ingredientItems = normalizeRecognizedIngredients(content);
    const ingredients = ingredientItems.map((item) => item.name);

    // 更新 token 消耗（累加 input + output）
    const totalUsed = (usage?.prompt_tokens || 0) + (usage?.completion_tokens || 0);
    if (totalUsed > 0) {
      await prisma.aiApiKey.update({
        where: { id: activeKey.id },
        data: { usedTokens: { increment: totalUsed } },
      });
    }

    void logAiUsage({
      apiKeyId: activeKey.id,
      model: activeKey.model,
      usage: 'vision',
      purpose: '食材识别',
      tokensIn: usage?.prompt_tokens || 0,
      tokensOut: usage?.completion_tokens || 0,
      userId,
      userName,
      input: imageUrl,
      output: ingredients.join('、'),
      duration: Date.now() - start,
      success: true,
    });
    saveIngredientRecognitionLog({
      userId,
      imageUrl,
      ingredients: ingredientItems,
      model: activeKey.model,
      tokensUsed: totalUsed,
      rawResponse,
    }).catch((err) => console.error('[Recognize] Log save failed:', err?.message || err));

    res.json(success({
      ingredients,
      ingredientItems,
      model: activeKey.model,
      tokensUsed: totalUsed,
      usage: usage || null,
      apiKeyName: activeKey.name,
    }));
  } catch (err: any) {
    console.error('[Recognize] Error:', err);
    void logAiUsage({
      apiKeyId: activeKey.id,
      model: activeKey.model,
      usage: 'vision',
      purpose: '食材识别',
      userId,
      userName,
      input: imageUrl,
      duration: Date.now() - start,
      success: false,
      error: err?.message || String(err),
    });
    res.status(500).json(badRequest(`识别失败: ${err.message}`));
  }
}));

export default router;
