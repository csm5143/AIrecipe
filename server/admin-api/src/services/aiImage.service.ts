/**
 * AI 图片生成服务
 * 动态 Prompt 模板库（从数据库读取） + 动态参数替换 + COS 上传
 */
import { prisma } from '../lib/prisma';
import { COSService, COS_FOLDERS } from './cos.service';
import { logAiUsage } from './aiUsageLog.service';

// ============ 类型 ============

export interface PromptTemplate {
  id: number;
  name: string;
  description: string | null;
  scene: string;
  template: string;
  size: string;
  sortOrder: number;
  isActive: boolean;
}

// ============ 内部函数 ============

async function getActiveKey() {
  const key = await prisma.aiApiKey.findFirst({
    where: {
      isActive: true,
      AND: [
        { OR: [{ usage: 'image' }, { usage: null }] },
        { OR: [{ keyType: { in: ['image', 'multimodal'] } }, { keyType: null }] },
      ],
    },
    orderBy: [{ usage: 'asc' }], // 'image' < null, prefer image-specific key
  });
  if (!key) return null;
  return { id: key.id, apiKey: key.apiKey, baseUrl: key.baseUrl, model: key.model };
}

async function consumeTokens(keyId: number, tokens: number) {
  await prisma.aiApiKey.update({
    where: { id: keyId },
    data: { usedTokens: { increment: tokens } },
  }).catch(() => {});
}

async function callImageAPI(aiKey: NonNullable<Awaited<ReturnType<typeof getActiveKey>>>, prompt: string, size: string, refImage?: string): Promise<string> {
  const base = aiKey.baseUrl.replace(/\/$/, '').replace(/\/images\/generations$/, '');
  const url = `${base}/images/generations`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 180000); // 3 分钟超时
  try {
    const body: any = { model: aiKey.model, prompt, n: 1, size };
    // 图生图：传参考图
    if (refImage) {
      body.image = refImage;
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${aiKey.apiKey}` },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);

    const ct = res.headers.get('content-type') || '';
    if (!res.ok) {
      const err = await res.text();
      const preview = ct.includes('html') ? `[服务商返回了网页而非 API 响应，baseUrl 或 API Key 可能不对]` : err.slice(0, 200);
      throw new Error(`AI API [${res.status}]: ${preview}`);
    }

    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      const preview = ct.includes('html') ? `服务商返回了网页而非 API 响应，请检查 baseUrl 和 API Key 是否有效` : text.slice(0, 200);
      throw new Error(`AI 服务商响应异常: ${preview}`);
    }
    // 兼容多种返回格式
    return data?.data?.[0]?.url
      || data?.images?.[0]?.url
      || data?.data?.[0]?.b64_json
      || '';
  } finally {
    clearTimeout(timer);
  }
}

async function downloadAndUpload(imageData: string, folder: string, name: string): Promise<string> {
  let buf: Buffer;
  if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
    const resp = await fetch(imageData);
    buf = Buffer.from(await resp.arrayBuffer());
  } else {
    // base64 编码的图片数据
    buf = Buffer.from(imageData, 'base64');
  }
  const result = await COSService.uploadFile(buf, folder, `${name}.png`);
  return result.url;
}

function fillTemplate(tmpl: string, vars: Record<string, string>): string {
  let result = tmpl;
  for (const [k, v] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v);
  }
  return result.slice(0, 900);
}

export interface GenerateImageParams {
  templateId: string;
  dishName?: string;
  ingredients?: string;
  plateStyle?: string;
  stepDescription?: string;
  size?: string;
  prompt?: string;
  model?: string;
  aiKeyId?: number;
  /** 图生图参考图片（base64 或 URL） */
  refImage?: string;
}

export interface GenerateImageResult {
  success: boolean;
  cosUrl?: string;
  error?: string;
}

// ============ 公开 API ============

export async function getTemplates(): Promise<PromptTemplate[]> {
  return prisma.promptTemplate.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
}

/**
 * 生成图片（通用入口）
 * 返回 COS URL，不更新数据库（由调用方决定）
 */
export async function generateImage(params: GenerateImageParams): Promise<GenerateImageResult> {
  let aiKey: { id: number; apiKey: string; baseUrl: string; model: string } | null = null;

  // 优先使用指定 Key ID
  if (params.aiKeyId) {
    const key = await prisma.aiApiKey.findUnique({ where: { id: params.aiKeyId } });
    if (key) {
      aiKey = { id: key.id, apiKey: key.apiKey, baseUrl: key.baseUrl, model: key.model };
    }
  }

  // 没有指定或未找到，fallback 到激活的 Key
  if (!aiKey) {
    aiKey = await getActiveKey();
  }

  if (!aiKey) return { success: false, error: '没有可用的 AI Key，请在系统设置中配置并激活' };

  let prompt: string;
  let size: string;

  // 支持数字 ID（DB）和字符串 ID（历史兼容）
  const tid = parseInt(String(params.templateId || '0'));
  const tmpl = !isNaN(tid) && tid > 0
    ? await prisma.promptTemplate.findFirst({ where: { id: tid } })
    : null;

  if (tmpl) {
    prompt = params.prompt?.trim()
      || fillTemplate(tmpl.template, {
        dishName: params.dishName || 'Chinese dish',
        ingredients: params.ingredients || 'fresh ingredients',
        plateStyle: params.plateStyle || 'rustic ceramic plate',
        stepDescription: params.stepDescription || 'cooking steps',
      });
    size = params.size || tmpl.size;
  } else {
    // 自由创作模式：直接使用用户 prompt
    if (!params.prompt?.trim()) return { success: false, error: '请提供提示词或选择模板' };
    prompt = params.prompt.trim();
    size = params.size || '1024x1024';
  }
  if (params.model) aiKey.model = params.model;

  const start = Date.now();
  try {
    const rawUrl = await callImageAPI(aiKey, prompt, size, params.refImage);
    if (!rawUrl) {
      void logAiUsage({
        apiKeyId: aiKey.id,
        model: aiKey.model,
        usage: 'image',
        purpose: 'AI生图',
        input: prompt,
        duration: Date.now() - start,
        success: false,
        error: 'AI 未返回图片',
      });
      return { success: false, error: 'AI 未返回图片' };
    }

    const cosUrl = await downloadAndUpload(rawUrl, COS_FOLDERS.AI_GENERATED, `img_${Date.now()}`);

    await consumeTokens(aiKey.id, 600);

    void logAiUsage({
      apiKeyId: aiKey.id,
      model: aiKey.model,
      usage: 'image',
      purpose: 'AI生图',
      tokensOut: 600,
      input: prompt,
      output: cosUrl,
      duration: Date.now() - start,
      success: true,
    });

    return { success: true, cosUrl, error: undefined };
  } catch (e: any) {
    console.error('[AIImage] 生成失败:', e.message);
    void logAiUsage({
      apiKeyId: aiKey.id,
      model: aiKey.model,
      usage: 'image',
      purpose: 'AI生图',
      input: prompt,
      duration: Date.now() - start,
      success: false,
      error: e?.message || String(e),
    });
    return { success: false, error: e.message };
  }
}

/**
 * 生成菜谱封面（封装：生成 + 自动更新菜谱表）
 */
export async function generateRecipeCover(recipeId: number, templateId: string): Promise<GenerateImageResult> {
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: { title: true, ingredients: true, category: true },
  });
  if (!recipe) return { success: false, error: '菜谱不存在' };

  const ingNames = ((recipe.ingredients as any[]) || []).slice(0, 3).map((i: any) => i.name).join(', ') || 'main ingredients';

  const categoryPlate: Record<string, string> = {
    '面食': 'white ceramic deep bowl',
    '汤品': 'traditional ceramic soup bowl',
    '饮品': 'tall transparent glass',
    '小炒菜': 'dark slate plate garnished with green herbs',
    '凉菜': 'flat white porcelain plate',
    '甜品': 'elegant dessert plate',
    '儿童餐': 'colorful kid-friendly plate',
  };

  const result = await generateImage({
    templateId,
    dishName: recipe.title,
    ingredients: ingNames,
    plateStyle: categoryPlate[recipe.category || ''] || 'rustic ceramic plate',
  });

  if (result.success && result.cosUrl) {
    await prisma.recipe.update({
      where: { id: recipeId },
      data: { coverImage: result.cosUrl },
    });
  }
  return result;
}

/**
 * 生成菜谱步骤图
 */
export async function generateRecipeStep(recipeId: number, stepIndex: number, templateId: string): Promise<GenerateImageResult> {
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: { title: true, steps: true },
  });
  if (!recipe) return { success: false, error: '菜谱不存在' };

  const steps = (recipe.steps as any[]) || [];
  const step = steps[stepIndex];
  if (!step) return { success: false, error: '步骤不存在' };
  const stepText = typeof step === 'string' ? step : (step.content || step.description || `步骤 ${stepIndex + 1}`);

  const result = await generateImage({
    templateId,
    dishName: recipe.title,
    stepDescription: stepText,
  });

  if (result.success && result.cosUrl) {
    const updated = [...steps];
    updated[stepIndex] = { ...updated[stepIndex], image: result.cosUrl };
    await prisma.recipe.update({
      where: { id: recipeId },
      data: { steps: updated },
    });
  }
  return result;
}
