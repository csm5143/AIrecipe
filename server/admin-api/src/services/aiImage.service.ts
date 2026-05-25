/**
 * AI 图片生成服务
 * 内置 Prompt 模板库 + 动态参数替换 + COS 上传
 */
import { prisma } from '../lib/prisma';
import { COSService } from './cos.service';

// ============ Prompt 模板库 ============

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  /** 适用场景 */
  scene: 'cover' | 'step' | 'banner' | 'card' | 'icon';
  /** 模板文本，用 {{key}} 做占位 */
  template: string;
  /** 推荐尺寸 */
  size: string;
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'cover_chinese_home',
    name: '中式家常·俯拍暖光',
    description: '适合小炒菜、家常菜的封面图，暖色调，俯拍视角',
    scene: 'cover',
    template: `professional Chinese food photography, overhead close-up shot of {{dishName}}, featuring {{ingredients}}, served on {{plateStyle}}, warm golden natural window light, steam rising, shallow depth of field, dark rustic wooden table, appetizing and vibrant colors, 4K ultra detailed, commercial food photo, no text no watermark`,
    size: '1024x1024',
  },
  {
    id: 'cover_japanese_clean',
    name: '日系清新·自然光',
    description: '适合轻食、饮品、甜品的封面图，明亮清新风格',
    scene: 'cover',
    template: `Japanese minimalist food photography, bright natural lighting, {{dishName}} with {{ingredients}}, on white ceramic plate, clean composition, soft shadows, light wood table, fresh and airy, 4K, no text`,
    size: '1024x1024',
  },
  {
    id: 'cover_soup_hotpot',
    name: '汤品火锅·热气氛围',
    description: '适合汤品、火锅、面食，突出热气腾腾的感觉',
    scene: 'cover',
    template: `steaming hot {{dishName}}, rich broth with {{ingredients}}, in traditional ceramic pot, dramatic warm lighting, steam visible, cozy atmosphere, Chinese cuisine, 4K food photography, no text`,
    size: '1024x1024',
  },
  {
    id: 'step_cooking',
    name: '烹饪过程·厨房自然光',
    description: '步骤图，展示烹饪动作',
    scene: 'step',
    template: `cooking process photo, {{stepDescription}}, hands preparing food, clean bright kitchen, natural daylight, top-down angle, sharp focus on the action, professional food photography, 4K`,
    size: '1024x1024',
  },
  {
    id: 'banner_atmospheric',
    name: '轮播图·氛围横版',
    description: '适合首页轮播，留白放文字, 横版',
    scene: 'banner',
    template: `atmospheric food scene, {{dishName}}, elegant restaurant atmosphere, warm golden hour light, horizontal composition, negative space on top for text overlay, shallow depth of field, 4K, commercial photography, no text overlay`,
    size: '1920x800',
  },
  {
    id: 'card_vertical',
    name: '卡片·竖版特写',
    description: '适合小卡片展示，竖版构图',
    scene: 'card',
    template: `close-up food shot, {{dishName}} with {{ingredients}}, rustic ceramic plate, warm lighting, vertical portrait composition, rich textures, 4K, appetizing, no text`,
    size: '800x1200',
  },
  {
    id: 'icon_flat',
    name: '图标·扁平矢量',
    description: '适合做图标，简约风格',
    scene: 'icon',
    template: `flat vector style icon of {{dishName}}, simple minimal design, transparent background, single object centered, warm color palette, clean lines, suitable for app icon`,
    size: '512x512',
  },
];

// ============ 内部函数 ============

async function getActiveKey(type: 'image' | 'text' = 'image') {
  const key = await prisma.aiApiKey.findFirst({
    where: { isActive: true },
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

async function callImageAPI(aiKey: NonNullable<Awaited<ReturnType<typeof getActiveKey>>>, prompt: string, size: string): Promise<string> {
  const base = aiKey.baseUrl.replace(/\/$/, '').replace(/\/images\/generations$/, '');
  const url = `${base}/images/generations`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${aiKey.apiKey}` },
    body: JSON.stringify({ model: aiKey.model, prompt, n: 1, size }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AI API [${res.status}]: ${err.slice(0, 200)}`);
  }

  const data = await res.json() as any;
  // 兼容多种返回格式
  return data?.data?.[0]?.url
    || data?.images?.[0]?.url
    || data?.data?.[0]?.b64_json
    || '';
}

async function downloadAndUpload(imageUrl: string, folder: string, name: string): Promise<string> {
  const resp = await fetch(imageUrl);
  const buf = Buffer.from(await resp.arrayBuffer());
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
  /** 用户自定义 prompt，传了则跳过模板 */
  prompt?: string;
  /** 覆盖激活 Key 的 model */
  model?: string;
}

export interface GenerateImageResult {
  success: boolean;
  cosUrl?: string;
  error?: string;
}

// ============ 公开 API ============

export async function getTemplates(): Promise<PromptTemplate[]> {
  return PROMPT_TEMPLATES;
}

/**
 * 生成图片（通用入口）
 * 返回 COS URL，不更新数据库（由调用方决定）
 */
export async function generateImage(params: GenerateImageParams): Promise<GenerateImageResult> {
  const aiKey = await getActiveKey();
  if (!aiKey) return { success: false, error: '没有激活的 AI Key，请在系统设置 → AI Key 管理中配置' };

  const tmpl = PROMPT_TEMPLATES.find(t => t.id === params.templateId);
  if (!tmpl) return { success: false, error: '模板不存在' };

  const prompt = params.prompt?.trim()
    || fillTemplate(tmpl.template, {
      dishName: params.dishName || 'Chinese dish',
      ingredients: params.ingredients || 'fresh ingredients',
      plateStyle: params.plateStyle || 'rustic ceramic plate',
      stepDescription: params.stepDescription || 'cooking steps',
    });
  const size = params.size || tmpl.size;
  if (params.model) aiKey.model = params.model;

  try {
    const rawUrl = await callImageAPI(aiKey, prompt, size);
    if (!rawUrl) return { success: false, error: 'AI 未返回图片' };

    const cosUrl = await downloadAndUpload(rawUrl, 'ai-generated', `img_${Date.now()}`);

    await consumeTokens(aiKey.id, 600);

    return { success: true, cosUrl, error: undefined };
  } catch (e: any) {
    console.error('[AIImage] 生成失败:', e.message);
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
