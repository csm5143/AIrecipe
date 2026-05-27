import { Request, Response } from 'express';
import { success, paginated, notFound } from '../../../types/response';
import { prisma } from '../../../lib/prisma';
import { getAdminId, createOperationLog } from '../../../utils/adminHelper';

function maskKey(key: string): string {
  if (key.length <= 8) return '****';
  return key.slice(0, 4) + '****' + key.slice(-4);
}

export async function getAiKeys(req: Request, res: Response) {
  const keys = await prisma.aiApiKey.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const list = keys.map(k => ({
    id: k.id,
    name: k.name,
    apiKey: maskKey(k.apiKey),
    apiKeyRaw: k.apiKey,
    baseUrl: k.baseUrl,
    model: k.model,
    keyType: k.keyType,
    totalTokens: k.totalTokens,
    usedTokens: k.usedTokens,
    remaining: Math.max(0, k.totalTokens - k.usedTokens),
    isActive: k.isActive,
    createdAt: k.createdAt.toISOString().slice(0, 16).replace('T', ' '),
  }));

  res.json(success(list));
}

export async function createAiKey(req: Request, res: Response) {
  const { name, apiKey, baseUrl, model, keyType, totalTokens } = req.body;

  if (!name || !apiKey || !baseUrl || !model || !totalTokens) {
    res.status(400).json({ code: 400, message: '缺少必填字段', timestamp: Date.now() });
    return;
  }

  // 如果是该类型的第一个 Key，自动设为激活
  const where: any = keyType ? { keyType } : { keyType: null };
  const count = await prisma.aiApiKey.count({ where });
  const isFirst = count === 0;

  const key = await prisma.aiApiKey.create({
    data: {
      name,
      apiKey,
      baseUrl,
      model,
      keyType: keyType || null,
      totalTokens: Number(totalTokens),
      isActive: isFirst,
    },
  });

  // 操作日志写入失败不影响主业务，改为静默捕获
  try {
    await createOperationLog(
      getAdminId(req),
      '',
      'create',
      'aiKey',
      String(key.id),
      `新增 AI Key「${name}」${keyType ? `类型:${keyType} ` : ''}${isFirst ? '（自动激活）' : ''}`,
      req.ip || undefined
    );
  } catch (e) {
    console.warn('[AI-Key] 操作日志写入失败:', e);
  }

  res.json(success({
    id: key.id,
    name: key.name,
    apiKey: maskKey(key.apiKey),
    baseUrl: key.baseUrl,
    model: key.model,
    keyType: key.keyType,
    totalTokens: key.totalTokens,
    usedTokens: key.usedTokens,
    remaining: key.totalTokens,
    isActive: key.isActive,
    createdAt: key.createdAt.toISOString().slice(0, 16).replace('T', ' '),
  }, 'AI Key 创建成功'));
}

export async function updateAiKey(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  const { name, apiKey, baseUrl, model, keyType, totalTokens } = req.body;

  const existing = await prisma.aiApiKey.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json(notFound('AI Key 不存在'));
    return;
  }

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (apiKey !== undefined) updateData.apiKey = apiKey;
  if (baseUrl !== undefined) updateData.baseUrl = baseUrl;
  if (model !== undefined) updateData.model = model;
  if (keyType !== undefined) updateData.keyType = keyType;
  if (totalTokens !== undefined) updateData.totalTokens = Number(totalTokens);

  const updated = await prisma.aiApiKey.update({
    where: { id },
    data: updateData,
  });

  try {
    await createOperationLog(
      getAdminId(req),
      '',
      'update',
      'aiKey',
      String(id),
      `更新 AI Key「${updated.name}」`,
      req.ip || undefined
    );
  } catch (e) {
    console.warn('[AI-Key] 操作日志写入失败:', e);
  }

  res.json(success({
    id: updated.id,
    name: updated.name,
    apiKey: maskKey(updated.apiKey),
    baseUrl: updated.baseUrl,
    model: updated.model,
    keyType: updated.keyType,
    totalTokens: updated.totalTokens,
    usedTokens: updated.usedTokens,
    remaining: Math.max(0, updated.totalTokens - updated.usedTokens),
    isActive: updated.isActive,
    createdAt: updated.createdAt.toISOString().slice(0, 16).replace('T', ' '),
  }, 'AI Key 更新成功'));
}

export async function deleteAiKey(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  const existing = await prisma.aiApiKey.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json(notFound('AI Key 不存在'));
    return;
  }

  await prisma.aiApiKey.delete({ where: { id } });

  try {
    await createOperationLog(
      getAdminId(req),
      '',
      'delete',
      'aiKey',
      String(id),
      `删除了 AI Key「${existing.name}」`,
      req.ip || undefined
    );
  } catch (e) {
    console.warn('[AI-Key] 操作日志写入失败:', e);
  }

  res.json(success(null, '删除成功'));
}

export async function activateAiKey(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  const existing = await prisma.aiApiKey.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json(notFound('AI Key 不存在'));
    return;
  }

  // 切换指定 Key 的激活状态（不再互斥，同类型允许多个激活）
  const updated = await prisma.aiApiKey.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });

  try {
    await createOperationLog(
      getAdminId(req),
      '',
      'update',
      'aiKey',
      String(id),
      `切换${existing.keyType ? `「${existing.keyType}类」` : ''}AI Key 为「${updated.name}」`,
      req.ip || undefined
    );
  } catch (e) {
    console.warn('[AI-Key] 操作日志写入失败:', e);
  }

  res.json(success({ isActive: updated.isActive }, updated.isActive ? `已启用「${updated.name}」` : `已停用「${updated.name}」`));
}

export async function getActiveAiKey(req: Request, res: Response) {
  const key = await prisma.aiApiKey.findFirst({
    where: { isActive: true },
  });

  if (!key) {
    res.json(success(null, '暂无激活的 AI Key'));
    return;
  }

  res.json(success({
    id: key.id,
    name: key.name,
    apiKey: key.apiKey,
    baseUrl: key.baseUrl,
    model: key.model,
    totalTokens: key.totalTokens,
    usedTokens: key.usedTokens,
    remaining: Math.max(0, key.totalTokens - key.usedTokens),
    isActive: key.isActive,
  }));
}

export async function testAiKey(req: Request, res: Response) {
  const { apiKey, baseUrl, model } = req.body as { apiKey?: string; baseUrl?: string; model?: string };

  if (!apiKey || !baseUrl || !model) {
    res.status(400).json({ code: 400, message: 'apiKey、baseUrl、model 均不能为空', timestamp: Date.now() });
    return;
  }

  // 自动移除用户多余的后缀路径
  let base = baseUrl.replace(/\/$/, '');
  base = base.replace(/\/images\/generations$/, '').replace(/\/chat\/completions$/, '');
  const isImageModel = /image|dall-e|flux|stable|midjourney/i.test(model);

  const [endpoint, body] = isImageModel
    ? ['/images/generations', JSON.stringify({ model, prompt: 'test', n: 1, size: '1024x1024' })]
    : ['/chat/completions', JSON.stringify({ model, messages: [{ role: 'user', content: 'Hi' }], max_tokens: 10 })];

  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(`${base}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body,
      signal: controller.signal,
    });
    clearTimeout(timer);

    const elapsed = Date.now() - start;
    const text = await response.text();
    let data: any = {};
    try { data = JSON.parse(text); } catch (_) {}

    if (!response.ok) {
      res.json(success({
        success: false,
        status: response.status,
        error: data?.error?.message || text.slice(0, 200),
        elapsed,
      }));
      return;
    }

    const result: any = { success: true, model: data.model || model, elapsed };
    if (isImageModel) {
      result.response = data?.data?.[0]?.url ? '图片生成接口连接成功' : '已连接';
    } else {
      result.response = data?.choices?.[0]?.message?.content?.trim() || '已连接';
      const tokens = (data.usage?.prompt_tokens || 0) + (data.usage?.completion_tokens || 0);
      result.tokens = tokens;
    }

    res.json(success(result));
  } catch (err: any) {
    clearTimeout(timer);
    const msg = err.name === 'AbortError' ? '连接超时（12s），请检查 baseUrl 和 API 是否可达' : err.message;
    res.json(success({ success: false, error: msg, elapsed: Date.now() - start }));
  }
}
