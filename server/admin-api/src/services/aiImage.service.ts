/**
 * AI 图片生成服务
 * 动态 Prompt 模板库（从数据库读取） + 动态参数替换 + COS 上传
 */
import { prisma } from '../lib/prisma';
import { COSService, COS_FOLDERS } from './cos.service';
import { logAiUsage } from './aiUsageLog.service';
import { buildStorageKey } from '../utils/storageKey';

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
  const timer = setTimeout(() => controller.abort(), 420000); // 7 分钟超时
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

async function downloadAndUpload(
  imageData: string,
  options: Partial<Parameters<typeof buildStorageKey>[0]> = {},
): Promise<string> {
  let buf: Buffer;
  if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
    const resp = await fetch(imageData);
    buf = Buffer.from(await resp.arrayBuffer());
  } else if (imageData.startsWith('data:')) {
    const [, base64 = ''] = imageData.split(',', 2);
    buf = Buffer.from(base64, 'base64');
  } else {
    // base64 编码的图片数据
    buf = Buffer.from(imageData, 'base64');
  }
  const result = await COSService.uploadFile(
    buf,
    options.folder || COS_FOLDERS.AI_GENERATED,
    `${options.label || options.prefix || 'ai-image'}.png`,
    {
      prefix: options.prefix || 'ai',
      label: options.label || 'ai-image',
      segments: options.segments || ['general'],
      stepIndex: options.stepIndex,
      index: options.index,
      ext: '.png',
    },
  );
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
  storage?: Partial<Parameters<typeof buildStorageKey>[0]>;
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

    const cosUrl = await downloadAndUpload(rawUrl, {
      folder: COS_FOLDERS.AI_GENERATED,
      prefix: params.storage?.prefix || 'ai',
      label: params.storage?.label || params.dishName || params.prompt || 'ai-image',
      segments: params.storage?.segments || ['general'],
      stepIndex: params.storage?.stepIndex,
      index: params.storage?.index,
    });

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
    storage: {
      folder: COS_FOLDERS.AI_GENERATED,
      segments: ['recipes', recipe.title, 'covers'],
      prefix: 'ai-cover',
      label: recipe.title,
    },
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
    storage: {
      folder: COS_FOLDERS.AI_GENERATED,
      segments: ['recipes', recipe.title, 'steps'],
      prefix: 'ai-step',
      label: recipe.title,
      stepIndex,
    },
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

// ──────────── Batch Recipe Image Set ────────────

export interface RecipeImageSetResult {
  success: boolean;
  recipeId: number;
  recipeTitle: string;
  coverImage?: string;
  stepImages: Array<{ stepIndex: number; imageUrl: string; stepContent: string }>;
  errors: Array<{ stepIndex: number; error: string }>;
  applied: boolean;
}

/**
 * Generate a complete, cohesive image set for a recipe:
 * cover + all step images with consistent style.
 * AI receives the full recipe flow so steps are visually connected.
 */
export async function generateRecipeImageSet(
  recipeId: number,
  templateId: number,
  options?: {
    overwrite?: boolean;
    autoApply?: boolean;
    styleNotes?: string;
    aiKeyId?: number;
  }
): Promise<RecipeImageSetResult> {
  const overwrite = options?.overwrite ?? true;
  const autoApply = options?.autoApply ?? false;

  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: { id: true, title: true, category: true, description: true, ingredients: true, steps: true, coverImage: true },
  });
  if (!recipe) return { success: false, recipeId, recipeTitle: '', stepImages: [], errors: [{ stepIndex: -1, error: '菜谱不存在' }], applied: false };

  const steps: any[] = Array.isArray(recipe.steps) ? recipe.steps : [];
  const ingNames = ((recipe.ingredients as any[]) || []).slice(0, 5)
    .map((i: any) => i.name || i).filter(Boolean).join('、') || '新鲜食材';
  const category = recipe.category || '家常菜';
  const categoryPlate: Record<string, string> = {
    '面食': '白色陶瓷深碗', '汤品': '传统汤碗', '饮品': '高脚透明玻璃杯',
    '小炒菜': '深色石板盘点缀绿色香草', '凉菜': '白色平盘',
    '甜品': '精致甜点盘', '儿童餐': '彩色儿童餐盘',
  };
  const plateStyle = categoryPlate[category] || '质朴陶瓷盘';
  const styleNotes = options?.styleNotes || '温暖自然光，美食摄影风格，浅景深，高分辨率';
  const tpl = templateId > 0
    ? await prisma.promptTemplate.findFirst({ where: { id: templateId } })
    : null;
  const size = tpl?.size || '1024x1024';

  const result: RecipeImageSetResult = {
    success: true, recipeId, recipeTitle: recipe.title, stepImages: [], errors: [], applied: false,
  };

  // Build all generation promises first, then execute in parallel
  const jobs: Array<() => Promise<void>> = [];

  // ── Cover job ──
  const needCover = overwrite || !recipe.coverImage;
  if (needCover) {
    const coverPrompt = `【${recipe.title}】成品摆盘照片。${styleNotes}。摆放在${plateStyle}上。这是这道菜的最终成品展示图，属于${category}类菜品。`;
    jobs.push(async () => {
      try {
        const coverRes = await generateImage({
          templateId: String(templateId), dishName: recipe.title,
          ingredients: ingNames, plateStyle, size,
          prompt: coverPrompt,
          aiKeyId: options?.aiKeyId,
          storage: {
            folder: COS_FOLDERS.AI_GENERATED,
            segments: ['recipes', recipe.title, 'covers'],
            prefix: 'ai-cover',
            label: recipe.title,
          },
        });
        if (coverRes.success && coverRes.cosUrl) result.coverImage = coverRes.cosUrl;
        else result.errors.push({ stepIndex: -1, error: coverRes.error || '封面生成失败' });
      } catch (e: any) {
        result.errors.push({ stepIndex: -1, error: e?.message || '封面异常' });
      }
    });
  }

  // ── Step jobs (build all promises upfront) ──
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const stepContent = typeof step === 'string' ? step : (step.content || step.description || `步骤${i + 1}`);
    const existingImage = !overwrite ? (step.image || step.imageUrl) : null;
    if (existingImage) {
      result.stepImages.push({ stepIndex: i, imageUrl: existingImage, stepContent });
      continue;
    }

    const prevSteps = steps.slice(0, i).map((s: any, j: number) => {
      const t = typeof s === 'string' ? s : (s.content || s.description || `步骤${j + 1}`);
      return `第${j + 1}步已做: ${t}`;
    }).join('; ');
    const stepNum = i + 1;
    const total = steps.length;

    const stepPrompt = `【${recipe.title}】制作系列图 第${stepNum}张/共${total + 1}张。步骤${stepNum}: ${stepContent}。${
      i === 0
        ? '第一张制作步骤图，展示食材准备阶段，砧板、刀具、食材摆放的特写镜头。为这道菜的制作流程建立视觉起点。'
        : i === steps.length - 1
          ? `最后一步制作图，即将完成的烹饪动作，锅中或盘中接近成品状态。${prevSteps ? `此前: ${prevSteps}` : ''}`
          : `中间步骤，展示烹饪过程的手部动作。${prevSteps ? `此前: ${prevSteps}` : ''}这是同一道菜的连续动作，保持相同的厨房光线、拍摄角度和风格。`
    }。${styleNotes}`;

    jobs.push(async () => {
      try {
        const stepRes = await generateImage({
          templateId: String(templateId), dishName: recipe.title,
          ingredients: ingNames, plateStyle: '厨房灶台，烹饪进行中',
          stepDescription: `步骤${stepNum}: ${stepContent}`,
          prompt: stepPrompt, size,
          aiKeyId: options?.aiKeyId,
          storage: {
            folder: COS_FOLDERS.AI_GENERATED,
            segments: ['recipes', recipe.title, 'steps'],
            prefix: 'ai-step',
            label: recipe.title,
            stepIndex: i,
          },
        });
        if (stepRes.success && stepRes.cosUrl) {
          result.stepImages.push({ stepIndex: i, imageUrl: stepRes.cosUrl, stepContent });
        } else {
          result.errors.push({ stepIndex: i, error: stepRes.error || '生成失败' });
        }
      } catch (e: any) {
        result.errors.push({ stepIndex: i, error: e?.message || '生成异常' });
      }
    });
  }

  // Execute sequentially with retry on server errors
  const MAX_RETRIES = 3;

  for (const fn of jobs) {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        await fn();
        break;
      } catch (e: any) {
        const msg = e?.message || String(e);
        const isServerError = /502|503|504|timeout|upstream|no available/i.test(msg);
        if (isServerError && attempt < MAX_RETRIES - 1) {
          const delay = (attempt + 1) * 3000;
          console.warn(`[ImageSet] Retry ${attempt + 1}/${MAX_RETRIES - 1} after ${delay}ms: ${msg}`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        throw e;
      }
    }
  }

  // Sort step images by stepIndex (parallel execution may return out of order)
  result.stepImages.sort((a, b) => a.stepIndex - b.stepIndex);

  result.success = result.stepImages.length > 0 || !!result.coverImage;

  // ── 3. Auto-apply ──
  if (autoApply) {
    const updateData: any = {};
    if (result.coverImage) updateData.coverImage = result.coverImage;
    if (result.stepImages.length > 0) {
      updateData.steps = steps.map((s: any, i: number) => {
        const gen = result.stepImages.find(si => si.stepIndex === i);
        const stepObj = typeof s === 'string' ? { content: s } : { ...s };
        if (gen) stepObj.image = gen.imageUrl;
        return stepObj;
      });
    }
    if (Object.keys(updateData).length > 0) {
      await prisma.recipe.update({ where: { id: recipeId }, data: updateData });
      result.applied = true;
    }
  }

  return result;
}

/**
 * Streaming version: sends SSE events as each image completes.
 */
export async function generateRecipeImageSetStream(
  recipeId: number,
  templateId: number,
  options: { overwrite?: boolean; styleNotes?: string; aiKeyId?: number } | undefined,
  onEvent: (data: Record<string, unknown>) => void,
): Promise<void> {
  const overwrite = options?.overwrite ?? true;
  const styleNotes = options?.styleNotes || '温暖自然光，美食摄影风格，浅景深，高分辨率';

  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: { id: true, title: true, category: true, ingredients: true, steps: true, coverImage: true },
  });
  if (!recipe) { onEvent({ type: 'error', error: '菜谱不存在' }); return; }

  const steps: any[] = Array.isArray(recipe.steps) ? recipe.steps : [];
  const ingNames = ((recipe.ingredients as any[]) || []).slice(0, 5)
    .map((i: any) => i.name || i).filter(Boolean).join('、') || '新鲜食材';
  const category = recipe.category || '家常菜';
  const plateStyle: Record<string, string> = { '面食': '白色陶瓷深碗', '小炒菜': '深色石板盘点缀绿色香草', '凉菜': '白色平盘', '甜品': '精致甜点盘' };
  const plate = plateStyle[category] || '质朴陶瓷盘';
  const size = templateId > 0 ? ((await prisma.promptTemplate.findFirst({ where: { id: templateId } }))?.size || '1024x1024') : '1024x1024';

  const emit = (d: any) => { try { onEvent(d); } catch {} };
  const MAX_RETRIES = 2;

  // Cover
  const needCover = overwrite || !recipe.coverImage;
  if (needCover) {
    emit({ type: 'start', label: `${recipe.title} · 封面`, stepIndex: -1 });
    const p = `【${recipe.title}】成品摆盘照片。${styleNotes}。摆放在${plate}上。`;
    for (let a = 0; a <= MAX_RETRIES; a++) {
      try {
        const r = await generateImage({ templateId: String(templateId), dishName: recipe.title, ingredients: ingNames, plateStyle: plate, size, prompt: p, aiKeyId: options?.aiKeyId });
        if (r.success && r.cosUrl) { emit({ type: 'result', stepIndex: -1, label: `${recipe.title} · 封面`, imageUrl: r.cosUrl, success: true }); break; }
        if (a < MAX_RETRIES) { emit({ type: 'retry', stepIndex: -1, attempt: a + 1 }); await new Promise(rs => setTimeout(rs, 3000)); }
        else emit({ type: 'result', stepIndex: -1, label: `${recipe.title} · 封面`, error: r.error || '失败', success: false });
      } catch (e: any) {
        if (/502|503|504|timeout|upstream|no available/i.test(e?.message) && a < MAX_RETRIES) {
          emit({ type: 'retry', stepIndex: -1, attempt: a + 1 }); await new Promise(rs => setTimeout(rs, (a + 1) * 3000));
        } else { emit({ type: 'result', stepIndex: -1, label: `${recipe.title} · 封面`, error: e?.message || '异常', success: false }); break; }
      }
    }
  }

  // Steps
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const content = typeof step === 'string' ? step : (step.content || step.description || `步骤${i + 1}`);
    const existing = !overwrite ? (step.image || step.imageUrl) : null;
    if (existing) { emit({ type: 'result', stepIndex: i, label: `${recipe.title} · 步骤${i + 1}`, imageUrl: existing, success: true, skipped: true }); continue; }

    emit({ type: 'start', label: `${recipe.title} · 步骤${i + 1}`, stepIndex: i });
    const sn = i + 1; const total = steps.length;
    const prev = steps.slice(0, i).map((s: any, j: number) => {
      const t = typeof s === 'string' ? s : (s.content || s.description || `步骤${j + 1}`);
      return `第${j + 1}步: ${t}`;
    }).join('; ');
    const prompt = `【${recipe.title}】制作系列图 第${sn}张/共${total + 1}张。步骤${sn}: ${content}。${i === 0 ? '第一张制作步骤图，食材准备阶段，砧板刀具特写。' : i === steps.length - 1 ? `最后一步，接近成品状态。此前: ${prev}` : `中间步骤，烹饪手部动作。此前: ${prev}。保持相同光线和风格。`}。${styleNotes}`;

    for (let a = 0; a <= MAX_RETRIES; a++) {
      try {
        const r = await generateImage({ templateId: String(templateId), dishName: recipe.title, ingredients: ingNames, plateStyle: '厨房灶台', stepDescription: `步骤${sn}: ${content}`, prompt, size, aiKeyId: options?.aiKeyId });
        if (r.success && r.cosUrl) { emit({ type: 'result', stepIndex: i, label: `${recipe.title} · 步骤${sn}`, imageUrl: r.cosUrl, success: true, stepContent: content }); break; }
        if (a < MAX_RETRIES) { emit({ type: 'retry', stepIndex: i, attempt: a + 1 }); await new Promise(rs => setTimeout(rs, 3000)); }
        else emit({ type: 'result', stepIndex: i, label: `${recipe.title} · 步骤${sn}`, error: r.error || '失败', success: false, stepContent: content });
      } catch (e: any) {
        if (/502|503|504|timeout|upstream|no available/i.test(e?.message) && a < MAX_RETRIES) {
          emit({ type: 'retry', stepIndex: i, attempt: a + 1 }); await new Promise(rs => setTimeout(rs, (a + 1) * 3000));
        } else { emit({ type: 'result', stepIndex: i, label: `${recipe.title} · 步骤${sn}`, error: e?.message || '异常', success: false, stepContent: content }); break; }
      }
    }
  }

  emit({ type: 'done', recipeId, recipeTitle: recipe.title });
}
