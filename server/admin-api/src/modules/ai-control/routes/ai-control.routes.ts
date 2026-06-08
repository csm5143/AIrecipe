import { Router, Router as ExpressRouter } from 'express';
import { asyncHandler } from '../../../utils/helper';
import { authenticate, authorize } from '../../auth/middleware/auth.middleware';
import { badRequest, paginated, success } from '../../../types/response';
import { prisma } from '../../../lib/prisma';
import { ensureAiQuotaDefaults, getAiQuotaConfig } from '../../../services/aiQuota.service';
import { hasTable } from '../../../services/databaseCapability.service';

const router: ExpressRouter = Router();

const AI_SETTING_KEYS = [
  'systemPrompt',
  'temperature',
  'maxTokens',
  'contextMessages',
  'ragTopK',
  'memoryTopK',
];

function parseSettingValue(value: string | null) {
  if (value === null || value === undefined || value === '') return '';
  if (/^(true|false)$/i.test(value)) return value.toLowerCase() === 'true';
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function stringifySettingValue(value: unknown) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value ?? '');
}

function toNumber(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

async function loadSettings(category: string) {
  const rows = await prisma.systemSetting.findMany({
    where: { category },
    orderBy: { key: 'asc' },
  });
  return Object.fromEntries(rows.map((row) => [row.key, parseSettingValue(row.value)]));
}

async function upsertSettings(category: string, data: Record<string, unknown>, allowedKeys?: string[]) {
  const entries = Object.entries(data).filter(([key]) => !allowedKeys || allowedKeys.includes(key));
  await Promise.all(
    entries.map(([key, value]) =>
      prisma.systemSetting.upsert({
        where: { category_key: { category, key } },
        update: { value: stringifySettingValue(value) },
        create: { category, key, value: stringifySettingValue(value) },
      }),
    ),
  );
}

router.use(asyncHandler(authenticate));

router.get('/dashboard', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN')), asyncHandler(async (_req, res) => {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  const [skillsReady, tasksReady] = await Promise.all([
    hasTable('ai_skills'),
    hasTable('scheduled_tasks'),
  ]);

  const [todayUsage, activeSessions, skills, pendingTasks] = await Promise.all([
    prisma.aiUsageLog.findMany({
      where: { usage: 'chat', createdAt: { gte: since } },
      select: { success: true, tokensIn: true, tokensOut: true, cost: true, duration: true, model: true },
    }),
    prisma.aiChatSession.count({
      where: { lastMessageAt: { gte: since }, status: 'ACTIVE' as any },
    }),
    skillsReady ? (prisma as any).aiSkill.count({ where: { isActive: true } }) : Promise.resolve(0),
    tasksReady ? (prisma as any).scheduledTask.count({ where: { fired: false } }) : Promise.resolve(0),
  ]);

  const successCount = todayUsage.filter((item) => item.success).length;
  const totalTokens = todayUsage.reduce((sum, item) => sum + item.tokensIn + item.tokensOut, 0);
  const totalCost = todayUsage.reduce((sum, item) => sum + (item.cost || 0), 0);
  const durations = todayUsage.map((item) => item.duration || 0).filter((item) => item > 0);

  res.json(success({
    todayCalls: todayUsage.length,
    todayTokens: totalTokens,
    todayCost: totalCost,
    successRate: todayUsage.length ? successCount / todayUsage.length : 1,
    averageDuration: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0,
    activeSessions,
    activeSkills: skills,
    pendingTasks,
  }));
}));

router.get('/settings', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN')), asyncHandler(async (_req, res) => {
  await ensureAiQuotaDefaults();
  const [ai, quota] = await Promise.all([
    loadSettings('ai'),
    getAiQuotaConfig(),
  ]);
  res.json(success({ ai, quota }));
}));

router.put('/settings', asyncHandler(authorize('SUPER_ADMIN')), asyncHandler(async (req, res) => {
  const { ai, quota } = req.body as { ai?: Record<string, unknown>; quota?: Record<string, unknown> };

  if (ai && typeof ai === 'object') {
    await upsertSettings('ai', ai, AI_SETTING_KEYS);
  }

  if (quota && typeof quota === 'object') {
    await upsertSettings('ai_quota', {
      dailyLimit: Math.floor(toNumber(quota.dailyLimit, 50)),
      dailyTokenLimit: Math.floor(toNumber(quota.dailyTokenLimit, 50000)),
      whitelist: Array.isArray(quota.whitelist)
        ? quota.whitelist.map((item) => Number(item)).filter((item) => Number.isFinite(item))
        : [],
    });
  }

  res.json(success(null, '保存成功'));
}));

router.get('/skills', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN')), asyncHandler(async (_req, res) => {
  if (!(await hasTable('ai_skills'))) {
    res.json(success([]));
    return;
  }
  const skills = await (prisma as any).aiSkill.findMany({
    orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
  });
  res.json(success(skills));
}));

router.post('/skills', asyncHandler(authorize('SUPER_ADMIN')), asyncHandler(async (req, res) => {
  if (!(await hasTable('ai_skills'))) {
    res.status(400).json(badRequest('AI 技能表尚未初始化，请先执行数据库迁移'));
    return;
  }
  const body = req.body || {};
  if (!body.name || !body.displayName) {
    res.status(400).json(badRequest('请填写技能标识和名称'));
    return;
  }
  const skill = await (prisma as any).aiSkill.create({
    data: {
      name: String(body.name).trim(),
      displayName: String(body.displayName).trim(),
      description: body.description || '',
      triggerKeywords: Array.isArray(body.triggerKeywords) ? body.triggerKeywords : [],
      tools: Array.isArray(body.tools) ? body.tools : [],
      systemPrompt: body.systemPrompt || '',
      priority: Math.floor(toNumber(body.priority, 0)),
      isActive: body.isActive !== false,
    },
  });
  res.json(success(skill, '创建成功'));
}));

router.put('/skills/:id', asyncHandler(authorize('SUPER_ADMIN')), asyncHandler(async (req, res) => {
  if (!(await hasTable('ai_skills'))) {
    res.status(400).json(badRequest('AI 技能表尚未初始化，请先执行数据库迁移'));
    return;
  }
  const id = parseInt(req.params.id);
  const body = req.body || {};
  const skill = await (prisma as any).aiSkill.update({
    where: { id },
    data: {
      ...(body.displayName !== undefined && { displayName: String(body.displayName).trim() }),
      ...(body.description !== undefined && { description: body.description || '' }),
      ...(body.triggerKeywords !== undefined && { triggerKeywords: Array.isArray(body.triggerKeywords) ? body.triggerKeywords : [] }),
      ...(body.tools !== undefined && { tools: Array.isArray(body.tools) ? body.tools : [] }),
      ...(body.systemPrompt !== undefined && { systemPrompt: body.systemPrompt || '' }),
      ...(body.priority !== undefined && { priority: Math.floor(toNumber(body.priority, 0)) }),
      ...(body.isActive !== undefined && { isActive: Boolean(body.isActive) }),
    },
  });
  res.json(success(skill, '保存成功'));
}));

router.patch('/skills/:id/toggle', asyncHandler(authorize('SUPER_ADMIN')), asyncHandler(async (req, res) => {
  if (!(await hasTable('ai_skills'))) {
    res.status(400).json(badRequest('AI 技能表尚未初始化，请先执行数据库迁移'));
    return;
  }
  const id = parseInt(req.params.id);
  const skill = await (prisma as any).aiSkill.update({
    where: { id },
    data: { isActive: Boolean(req.body?.isActive) },
  });
  res.json(success(skill, '状态已更新'));
}));

router.delete('/skills/:id', asyncHandler(authorize('SUPER_ADMIN')), asyncHandler(async (req, res) => {
  if (!(await hasTable('ai_skills'))) {
    res.status(400).json(badRequest('AI 技能表尚未初始化，请先执行数据库迁移'));
    return;
  }
  const id = parseInt(req.params.id);
  await (prisma as any).aiSkill.delete({ where: { id } });
  res.json(success(null, '删除成功'));
}));

router.get('/memories', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN')), asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page as string) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize as string) || 20, 1), 100);
  if (!(await hasTable('user_memories'))) {
    res.json(paginated([], { page, pageSize, total: 0 }));
    return;
  }
  const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
  const type = req.query.type ? String(req.query.type) : undefined;
  const where: any = {
    ...(userId && { userId }),
    ...(type && { type }),
  };
  const [list, total] = await Promise.all([
    (prisma as any).userMemory.findMany({
      where,
      include: { user: { select: { id: true, nickname: true, phone: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    (prisma as any).userMemory.count({ where }),
  ]);
  res.json(paginated(list, { page, pageSize, total }));
}));

router.delete('/memories/:id', asyncHandler(authorize('SUPER_ADMIN')), asyncHandler(async (req, res) => {
  if (!(await hasTable('user_memories'))) {
    res.status(400).json(badRequest('用户记忆表尚未初始化，请先执行数据库迁移'));
    return;
  }
  const id = parseInt(req.params.id);
  await (prisma as any).userMemory.delete({ where: { id } });
  res.json(success(null, '删除成功'));
}));

router.delete('/users/:userId/memories', asyncHandler(authorize('SUPER_ADMIN')), asyncHandler(async (req, res) => {
  if (!(await hasTable('user_memories'))) {
    res.status(400).json(badRequest('用户记忆表尚未初始化，请先执行数据库迁移'));
    return;
  }
  const userId = parseInt(req.params.userId);
  await (prisma as any).userMemory.deleteMany({ where: { userId } });
  res.json(success(null, '已清空该用户记忆'));
}));

router.get('/scheduled-tasks', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN')), asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page as string) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize as string) || 20, 1), 100);
  if (!(await hasTable('scheduled_tasks'))) {
    res.json(paginated([], { page, pageSize, total: 0 }));
    return;
  }
  const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
  const fired = req.query.fired !== undefined ? String(req.query.fired) === 'true' : undefined;
  const where: any = {
    ...(userId && { userId }),
    ...(fired !== undefined && { fired }),
  };
  const [list, total] = await Promise.all([
    (prisma as any).scheduledTask.findMany({
      where,
      include: { user: { select: { id: true, nickname: true, phone: true, email: true } } },
      orderBy: [{ fired: 'asc' }, { triggerAt: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    (prisma as any).scheduledTask.count({ where }),
  ]);
  res.json(paginated(list, { page, pageSize, total }));
}));

router.delete('/scheduled-tasks/:id', asyncHandler(authorize('SUPER_ADMIN')), asyncHandler(async (req, res) => {
  if (!(await hasTable('scheduled_tasks'))) {
    res.status(400).json(badRequest('提醒任务表尚未初始化，请先执行数据库迁移'));
    return;
  }
  const id = parseInt(req.params.id);
  await (prisma as any).scheduledTask.delete({ where: { id } });
  res.json(success(null, '删除成功'));
}));

export default router;
