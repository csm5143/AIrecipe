import { Router, Router as ExpressRouter } from 'express';
import recipeRoutes from './recipe.routes';
import favoriteRoutes from './favorite.routes';
import contentRoutes from './content.routes';
import ingredientRoutes from './ingredient.routes';
import { asyncHandler } from '../../../utils/helper';
import { wxAuthenticate } from '../../wx/middleware/wxAuth.middleware';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { prisma } from '../../../lib/prisma';
import { paginated, success, badRequest } from '../../../types/response';

const router: ExpressRouter = Router();

router.use('/recipes', recipeRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/content', contentRoutes);
router.use('/ingredients', ingredientRoutes);

// ============ AI 扫描记录（小程序用户端）============
// 挂载在 /api/v1/app/ai-scans 下，需要 wx 用户认证

router.post('/ai-scans', wxAuthenticate, asyncHandler(async (req, res) => {
  const userId = (req as any).userId;
  const { imageUrl, result, recipes, model, tokensUsed } = req.body as {
    imageUrl?: string;
    result?: { ingredients?: string[]; model?: string; tokensUsed?: number };
    recipes?: any[];
    model?: string;
    tokensUsed?: number;
  };

  if (!imageUrl) {
    res.status(400).json(badRequest('图片不能为空'));
    return;
  }

  const scan = await prisma.aiScan.create({
    data: {
      userId,
      imageUrl,
      result: result || {},
      recipes: recipes || null,
      status: result ? 'SUCCESS' : 'PROCESSING',
      model: model || result?.model || undefined,
      tokensUsed: tokensUsed ?? result?.tokensUsed ?? undefined,
    },
  });

  res.json(success(scan, '扫描记录已保存'));
}));

router.get('/ai-scans/my', wxAuthenticate, asyncHandler(async (req, res) => {
  const userId = (req as any).userId;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;

  const [list, total] = await Promise.all([
    prisma.aiScan.findMany({
      where: { userId },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.aiScan.count({ where: { userId } }),
  ]);

  res.json(paginated(list, { page, pageSize, total }));
}));

// ============ AI 食材识别（小程序端）============
// POST /api/v1/app/recognize
// 使用当前激活的 AI Key 进行多模态图片识别
router.post('/recognize', wxAuthenticate, asyncHandler(async (req, res) => {
  const { imageUrl } = req.body as { imageUrl?: string };

  if (!imageUrl) {
    res.status(400).json(badRequest('图片地址不能为空'));
    return;
  }

  // 获取激活的 AI Key
  const activeKey = await prisma.aiApiKey.findFirst({
    where: { isActive: true },
  });

  if (!activeKey) {
    res.status(503).json(badRequest('暂无可用的 AI Key，请联系管理员配置'));
    return;
  }

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
            text: '请仔细观察这张图片中的所有食材，用简体中文列出图片中能清楚看到的每一种食材名称。只返回食材名称列表，用换行分隔，不要返回其他说明。'
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
      res.status(502).json(badRequest(`AI 服务返回错误: ${aiRes.status}`));
      return;
    }

    rawResponse = await aiRes.json();
    usage = rawResponse.usage;
    const content = rawResponse.choices?.[0]?.message?.content || '';

    // 解析食材列表（按行分割，过滤空行）
    const ingredients = content
      .split('\n')
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 0 && l.length < 20)
      .slice(0, 20);

    // 更新 token 消耗（累加 input + output）
    const totalUsed = (usage?.prompt_tokens || 0) + (usage?.completion_tokens || 0);
    if (totalUsed > 0) {
      await prisma.aiApiKey.update({
        where: { id: activeKey.id },
        data: { usedTokens: { increment: totalUsed } },
      });
    }

    res.json(success({
      ingredients,
      model: activeKey.model,
      tokensUsed: totalUsed,
      usage: usage || null,
    }));
  } catch (err: any) {
    console.error('[Recognize] Error:', err);
    res.status(500).json(badRequest(`识别失败: ${err.message}`));
  }
}));

export default router;
