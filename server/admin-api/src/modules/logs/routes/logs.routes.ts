import { Router, Router as ExpressRouter } from 'express';
import { Prisma } from '@prisma/client';
import { asyncHandler } from '../../../utils/helper';
import { prisma } from '../../../lib/prisma';
import { authenticate, authorize } from '../../auth/middleware/auth.middleware';
import { paginated, success } from '../../../types/response';
import { exportLogs } from '../../../services/export.service';

const router: ExpressRouter = Router();

router.use(asyncHandler(authenticate));
router.use(asyncHandler(authorize('SUPER_ADMIN', 'ADMIN')));

type LogType = 'all' | 'admin' | 'user';

function normalizeType(value: unknown): LogType {
  const type = String(value || 'all').toLowerCase();
  return type === 'admin' || type === 'user' ? type : 'all';
}

function dateRange(startDate?: string, endDate?: string) {
  return {
    start: startDate ? new Date(startDate) : undefined,
    end: endDate ? new Date(`${endDate}T23:59:59.999`) : undefined,
  };
}

function adminSelect() {
  return Prisma.sql`
    SELECT
      ol.id::text AS id,
      'admin' AS "actorType",
      COALESCE(a.nickname, a.username, '未知管理员') AS "actorName",
      ol.action AS action,
      ol.module AS module,
      COALESCE(ol."targetId", '') AS target,
      COALESCE(ol.detail::text, '') AS detail,
      COALESCE(ol.ip, '') AS ip,
      ol."createdAt" AS "createdAt"
    FROM operation_logs ol
    LEFT JOIN admins a ON a.id = ol."adminId"
  `;
}

function userSelect() {
  return Prisma.sql`
    SELECT
      ual.id::text AS id,
      'user' AS "actorType",
      COALESCE(u.nickname, u.phone, u.openid, '未知用户') AS "actorName",
      ual.action AS action,
      'user_activity' AS module,
      COALESCE(ual."targetId", '') AS target,
      COALESCE(ual.detail, '') AS detail,
      COALESCE(ual.ip, '') AS ip,
      ual."createdAt" AS "createdAt"
    FROM user_activity_logs ual
    LEFT JOIN users u ON u.id = ual."userId"
  `;
}

function baseSql(type: LogType) {
  if (type === 'admin') return adminSelect();
  if (type === 'user') return userSelect();
  return Prisma.sql`${adminSelect()} UNION ALL ${userSelect()}`;
}

function buildUnifiedLogQuery(query: Record<string, unknown>) {
  const type = normalizeType(query.type);
  const page = Math.max(parseInt(query.page as string) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(query.pageSize as string) || 20, 1), 100);
  const keyword = String(query.keyword || '').trim();
  const action = String(query.action || '').trim();
  const { start, end } = dateRange(query.startDate as string, query.endDate as string);
  const filters: Prisma.Sql[] = [];

  if (keyword) {
    filters.push(Prisma.sql`(
      "actorName" ILIKE ${`%${keyword}%`}
      OR action ILIKE ${`%${keyword}%`}
      OR module ILIKE ${`%${keyword}%`}
      OR target ILIKE ${`%${keyword}%`}
      OR detail ILIKE ${`%${keyword}%`}
      OR ip ILIKE ${`%${keyword}%`}
    )`);
  }
  if (action) filters.push(Prisma.sql`action = ${action}`);
  if (start) filters.push(Prisma.sql`"createdAt" >= ${start}`);
  if (end) filters.push(Prisma.sql`"createdAt" <= ${end}`);

  const whereSql = filters.length
    ? Prisma.sql`WHERE ${Prisma.join(filters, ' AND ')}`
    : Prisma.empty;

  return {
    page,
    pageSize,
    sourceSql: baseSql(type),
    whereSql,
  };
}

function mapLogRow(row: any) {
  return {
    ...row,
    id: row.id,
    createdAt: row.createdAt instanceof Date
      ? row.createdAt.toISOString().slice(0, 19).replace('T', ' ')
      : String(row.createdAt || ''),
  };
}

function buildAiUsageWhere(query: Record<string, unknown>): any {
  const usage = String(query.usage || '').trim();
  const success = String(query.success || '').trim();
  const keyword = String(query.keyword || '').trim();
  const userId = parseInt(query.userId as string);
  const { start, end } = dateRange(query.startDate as string, query.endDate as string);

  const where: any = {};
  if (usage) where.usage = usage;
  if (success === 'true') where.success = true;
  if (success === 'false') where.success = false;
  if (!Number.isNaN(userId) && userId > 0) where.userId = userId;
  if (start || end) {
    where.createdAt = {
      ...(start ? { gte: start } : {}),
      ...(end ? { lte: end } : {}),
    };
  }
  if (keyword) {
    where.OR = [
      { model: { contains: keyword, mode: 'insensitive' } },
      { purpose: { contains: keyword, mode: 'insensitive' } },
      { userName: { contains: keyword, mode: 'insensitive' } },
      { input: { contains: keyword, mode: 'insensitive' } },
      { output: { contains: keyword, mode: 'insensitive' } },
      { error: { contains: keyword, mode: 'insensitive' } },
      { apiKey: { name: { contains: keyword, mode: 'insensitive' } } },
    ];
  }
  return where;
}

function usageLabel(usage?: string | null) {
  if (usage === 'chat') return 'AI 聊天';
  if (usage === 'vision') return '食材识别';
  if (usage === 'image') return 'AI 生图';
  return '通用';
}

function buildAiUsageSummary(rows: Array<{ usage: string | null; success: boolean; tokensIn: number; tokensOut: number; cost: number | null }>) {
  const byUsage: Record<string, { usage: string; label: string; count: number; successCount: number; failedCount: number; tokensIn: number; tokensOut: number; totalTokens: number; cost: number }> = {};
  const total = { count: 0, successCount: 0, failedCount: 0, tokensIn: 0, tokensOut: 0, totalTokens: 0, cost: 0 };

  rows.forEach((row) => {
    const key = row.usage || 'general';
    if (!byUsage[key]) {
      byUsage[key] = {
        usage: key,
        label: usageLabel(row.usage),
        count: 0,
        successCount: 0,
        failedCount: 0,
        tokensIn: 0,
        tokensOut: 0,
        totalTokens: 0,
        cost: 0,
      };
    }
    const item = byUsage[key];
    const rowTokens = row.tokensIn + row.tokensOut;
    item.count += 1;
    item.successCount += row.success ? 1 : 0;
    item.failedCount += row.success ? 0 : 1;
    item.tokensIn += row.tokensIn;
    item.tokensOut += row.tokensOut;
    item.totalTokens += rowTokens;
    item.cost += row.cost || 0;

    total.count += 1;
    total.successCount += row.success ? 1 : 0;
    total.failedCount += row.success ? 0 : 1;
    total.tokensIn += row.tokensIn;
    total.tokensOut += row.tokensOut;
    total.totalTokens += rowTokens;
    total.cost += row.cost || 0;
  });

  return { total, byUsage: Object.values(byUsage) };
}

router.get('/unified/export', asyncHandler(async (req, res) => {
  const { sourceSql, whereSql } = buildUnifiedLogQuery(req.query as Record<string, unknown>);
  const rows = await prisma.$queryRaw<any[]>`
    SELECT * FROM (${sourceSql}) unified_logs
    ${whereSql}
    ORDER BY "createdAt" DESC
  `;

  exportLogs(res, 'xlsx', rows.map(mapLogRow));
}));

router.get('/unified', asyncHandler(async (req, res) => {
  const { page, pageSize, sourceSql, whereSql } = buildUnifiedLogQuery(req.query as Record<string, unknown>);
  const offset = (page - 1) * pageSize;
  const [rows, countRows] = await Promise.all([
    prisma.$queryRaw<any[]>`
      SELECT * FROM (${sourceSql}) unified_logs
      ${whereSql}
      ORDER BY "createdAt" DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `,
    prisma.$queryRaw<Array<{ total: bigint }>>`
      SELECT COUNT(*)::bigint AS total FROM (${sourceSql}) unified_logs
      ${whereSql}
    `,
  ]);

  const list = rows.map(mapLogRow);
  const total = Number(countRows[0]?.total || 0);

  res.json(paginated(list, { page, pageSize, total }));
}));

// ==================== AI 使用记录查询 ====================

router.get('/ai-usage', asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page as string) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize as string) || 20, 1), 100);
  const where = buildAiUsageWhere(req.query as Record<string, unknown>);

  const [list, total, summaryRows] = await Promise.all([
    (prisma as any).aiUsageLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { apiKey: { select: { id: true, name: true, keyType: true, usage: true, pricePerMTok: true } } },
    }),
    (prisma as any).aiUsageLog.count({ where }),
    (prisma as any).aiUsageLog.findMany({
      where,
      select: { usage: true, success: true, tokensIn: true, tokensOut: true, cost: true },
    }),
  ]);

  const summary = buildAiUsageSummary(summaryRows);
  res.json(success({
    list: list.map((item) => ({
    id: item.id,
    apiKeyId: item.apiKeyId,
    apiKeyName: item.apiKey?.name || `Key #${item.apiKeyId}`,
    model: item.model,
    usage: item.usage,
    purpose: item.purpose,
    tokensIn: item.tokensIn,
    tokensOut: item.tokensOut,
    totalTokens: item.tokensIn + item.tokensOut,
    cost: item.cost || 0,
    userId: item.userId,
    userName: item.userName,
    input: item.input,
    output: item.output,
    duration: item.duration,
    success: item.success,
    error: item.error,
    createdAt: item.createdAt.toISOString().slice(0, 19).replace('T', ' '),
    })),
    total,
    page,
    pageSize,
    summary,
  }));
}));

// ==================== EmailLog 查询 ====================

router.get('/email-logs', asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page as string) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize as string) || 20, 1), 100);
  const keyword = String(req.query.keyword || '').trim();
  const status = String(req.query.status || '').trim();
  const type = String(req.query.type || '').trim();

  const where: any = {};
  if (status && ['sent', 'failed'].includes(status)) where.status = status;
  if (type) where.type = type;
  if (keyword) {
    where.OR = [
      { toEmail: { contains: keyword, mode: 'insensitive' } },
      { subject: { contains: keyword, mode: 'insensitive' } },
      { error: { contains: keyword, mode: 'insensitive' } },
    ];
  }

  const [list, total] = await Promise.all([
    prisma.emailLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.emailLog.count({ where }),
  ]);

  res.json(paginated(list, { page, pageSize, total }));
}));

// ==================== VerificationToken 查询 ====================

router.get('/verification-tokens', asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page as string) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize as string) || 20, 1), 100);
  const keyword = String(req.query.keyword || '').trim();
  const type = String(req.query.type || '').trim();
  const used = req.query.used; // 'true' | 'false' | undefined=all

  const where: any = {};
  if (type) where.type = type;
  if (used === 'true') where.usedAt = { not: null };
  else if (used === 'false') where.usedAt = null;
  if (keyword) {
    where.OR = [
      { email: { contains: keyword, mode: 'insensitive' } },
      { phone: { contains: keyword, mode: 'insensitive' } },
    ];
  }

  const [list, total] = await Promise.all([
    prisma.verificationToken.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      // 不返回完整验证码，只返回脱敏信息
      select: {
        id: true,
        email: true,
        phone: true,
        type: true,
        attempts: true,
        usedAt: true,
        expiresAt: true,
        createdAt: true,
      },
    }),
    prisma.verificationToken.count({ where }),
  ]);

  res.json(paginated(list, { page, pageSize, total }));
}));

export default router;
