import { prisma } from '../lib/prisma';
import { hasTable } from './databaseCapability.service';

export type RecognizedIngredient = {
  name: string;
  amount: string;
  unit: string;
  category: string;
  confidence: number;
};

const CATEGORY_KEYWORDS: Array<{ category: string; keywords: string[] }> = [
  { category: 'meat', keywords: ['牛肉', '猪肉', '鸡肉', '鸡翅', '排骨', '羊肉', '鱼', '虾', '肉'] },
  { category: 'vegetable', keywords: ['青椒', '辣椒', '土豆', '番茄', '西红柿', '黄瓜', '茄子', '蒜', '姜', '葱', '菜', '菇'] },
  { category: 'staple', keywords: ['米', '面', '面粉', '粉', '饭', '馒头', '饼'] },
  { category: 'egg_dairy', keywords: ['鸡蛋', '鸭蛋', '牛奶', '奶酪', '芝士'] },
  { category: 'seasoning', keywords: ['盐', '糖', '酱油', '生抽', '老抽', '蚝油', '料酒', '醋', '油', '淀粉'] },
  { category: 'fruit', keywords: ['苹果', '香蕉', '橙', '梨', '草莓', '芒果', '柠檬'] },
];

function inferCategory(name: string) {
  const matched = CATEGORY_KEYWORDS.find((group) => group.keywords.some((keyword) => name.includes(keyword)));
  return matched?.category || 'other';
}

function cleanIngredientName(value: string) {
  return value
    .replace(/^[-*•\d.、\s]+/, '')
    .replace(/[：:，,。；;！!？?（）()【】[\]"“”‘’]/g, ' ')
    .replace(/\s+/g, '')
    .trim();
}

function parseJsonIngredients(content: string): string[] {
  const match = content.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') return String(item.name || item.ingredient || '');
        return '';
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function normalizeRecognizedIngredients(value: unknown): RecognizedIngredient[] {
  const rawItems = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? parseJsonIngredients(value).length > 0
        ? parseJsonIngredients(value)
        : value.split(/\n|、|，|,/)
      : [];

  const items = new Map<string, RecognizedIngredient>();
  for (const rawItem of rawItems) {
    const source = typeof rawItem === 'string' ? { name: rawItem } : (rawItem || {}) as any;
    const name = cleanIngredientName(String(source.name || source.ingredient || ''));
    if (!name || name.length > 16) continue;
    if (/食材|识别|图片|看不清|无法|不确定|可能/.test(name)) continue;

    items.set(name, {
      name,
      amount: String(source.amount || source.quantity || '1').trim(),
      unit: String(source.unit || '').trim(),
      category: String(source.category || inferCategory(name)).trim(),
      confidence: Number.isFinite(Number(source.confidence)) ? Math.min(Math.max(Number(source.confidence), 0), 1) : 0.85,
    });
  }

  return Array.from(items.values()).slice(0, 30);
}

export async function saveIngredientRecognitionLog(input: {
  userId: number;
  imageUrl: string;
  ingredients: RecognizedIngredient[];
  model?: string;
  tokensUsed?: number;
  rawResponse?: unknown;
}) {
  if (input.ingredients.length === 0) return null;
  if (!(await hasTable('ingredient_recognition_logs'))) return null;

  return (prisma as any).ingredientRecognitionLog.create({
    data: {
      userId: input.userId,
      imageUrl: input.imageUrl,
      ingredients: input.ingredients,
      model: input.model || null,
      tokensUsed: input.tokensUsed || null,
      rawResponse: input.rawResponse || null,
    },
  });
}

export async function loadRecentRecognizedIngredients(userId: number, maxAgeMinutes = 60) {
  if (!(await hasTable('ingredient_recognition_logs'))) return null;
  const since = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
  const log = await (prisma as any).ingredientRecognitionLog.findFirst({
    where: {
      userId,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (!log) return null;

  const ingredients = normalizeRecognizedIngredients(log.ingredients);
  if (ingredients.length === 0) return null;
  return {
    id: log.id as number,
    imageUrl: String(log.imageUrl || ''),
    ingredients,
    createdAt: log.createdAt as Date,
  };
}
