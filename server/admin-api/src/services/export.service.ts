import { Response } from 'express';
import * as XLSX from 'xlsx';

// ---------- 类型映射 ----------
const DIFFICULTY_MAP: Record<string, string> = {
  EASY: '简单',
  MEDIUM: '中等',
  HARD: '困难',
};

const STATUS_MAP: Record<string, string> = {
  PUBLISHED: '已发布',
  DRAFT: '草稿',
  OFFLINE: '已下线',
  PENDING: '待审核',
  REJECTED: '已拒绝',
  ACTIVE: '启用',
  INACTIVE: '禁用',
};

const GENDER_MAP: Record<string, string> = {
  MALE: '男',
  FEMALE: '女',
  UNKNOWN: '未知',
};

const ACCOUNT_STATUS_MAP: Record<string, string> = {
  ACTIVE: '正常',
  DISABLED: '禁用',
  BANNED: '封禁',
};

// ---------- CSV 工具 ----------
function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function toCSVRow(row: unknown[]): string {
  return row.map(v => escapeCSV(v)).join(',') + '\n';
}

// ---------- 设置响应头 ----------
function setDownloadHeader(
  res: Response,
  filename: string,
  mime: 'csv' | 'xlsx' | 'json',
): void {
  const mimeMap: Record<string, string> = {
    csv: 'text/csv;charset=utf-8',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    json: 'application/json;charset=utf-8',
  };
  res.setHeader('Content-Type', `${mimeMap[mime]};charset=utf-8`);
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
}

// ---------- 通用 XLSX 写入 ----------
function writeXLSX(
  res: Response,
  filename: string,
  sheetName: string,
  headers: string[],
  keys: string[],
  rows: Record<string, unknown>[],
): void {
  // 中文表头行
  const wsData: unknown[][] = [headers];

  for (const row of rows) {
    wsData.push(keys.map(k => {
      const v = row[k];
      if (v === null || v === undefined) return '';
      if (Array.isArray(v)) return v.join('、');
      if (typeof v === 'boolean') return v ? '是' : '否';
      return v;
    }));
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // 自动列宽
  const colWidths = headers.map((h, i) => ({
    wch: Math.max(
      h.replace(/[^\x00-\xff]/g, 'xx').length * 1.2,
      ...rows.map(r => {
        const v = rows.indexOf(r);
        const val = wsData[v + 1]?.[i];
        return String(val ?? '').replace(/[^\x00-\xff]/g, 'xx').length * 1.1;
      }),
    ),
  }));
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
  res.end(buf);
}

// ---------- 通用 CSV 写入 ----------
function writeCSV(
  res: Response,
  filename: string,
  headers: string[],
  rows: Record<string, unknown>[],
  keyOrder: string[],
): void {
  const BOM = '\uFEFF';
  res.write(BOM);
  res.write(toCSVRow(headers));
  for (const row of rows) {
    res.write(toCSVRow(keyOrder.map(k => {
      const v = row[k];
      if (v === null || v === undefined) return '';
      if (Array.isArray(v)) return v.join('、');
      if (typeof v === 'boolean') return v ? '是' : '否';
      return v;
    })));
  }
  res.end();
}

// ===================== 菜谱导出 =====================
export function exportRecipes(
  res: Response,
  format: 'csv' | 'xlsx' | 'json',
  recipes: Record<string, unknown>[],
): void {
  const date = new Date().toISOString().slice(0, 10);
  const headers = ['ID', '菜谱标识', '标题', '封面图URL', '描述', '难度',
    '烹饪时长(分钟)', '份量(人)', '卡路里(kcal)', '分类', '菜系',
    '用餐时段', '菜品类型', '标签', '来源', '状态', '精选', '热门',
    '浏览量', '收藏量', '发布时间'];
  const keys = ['id', 'recipeKey', 'title', 'coverImage', 'description', 'difficulty',
    'cookingTime', 'servings', 'calories', 'category', 'cuisine',
    'mealTimes', 'dishTypes', 'tags', 'source', 'status',
    'isFeatured', 'isHot', 'viewCount', 'collectCount', 'publishedAt'];

  const rows = recipes.map(r => ({
    ...r,
    difficulty: DIFFICULTY_MAP[String(r.difficulty)] || r.difficulty,
    status: STATUS_MAP[String(r.status)] || r.status,
    isFeatured: r.isFeatured ? '是' : '否',
    isHot: r.isHot ? '是' : '否',
    mealTimes: Array.isArray(r.mealTimes) ? r.mealTimes.join('、') : '',
    dishTypes: Array.isArray(r.dishTypes) ? r.dishTypes.join('、') : '',
    tags: Array.isArray(r.tags) ? r.tags.join('、') : '',
    publishedAt: r.publishedAt ? new Date(r.publishedAt as string).toISOString().replace('T', ' ') : '',
  }));

  setDownloadHeader(res, `菜谱_${date}.${format}`, format);

  if (format === 'csv') {
    writeCSV(res, `菜谱_${date}.csv`, headers, rows, keys);
  } else if (format === 'xlsx') {
    writeXLSX(res, `菜谱_${date}.xlsx`, '菜谱', headers, keys, rows);
  } else {
    // JSON: 写原始数据数组，不用包装
    res.json(recipes);
  }
}

// ===================== 食材导出 =====================
export function exportIngredients(
  res: Response,
  format: 'csv' | 'xlsx' | 'json',
  ingredients: Record<string, unknown>[],
): void {
  const date = new Date().toISOString().slice(0, 10);
  const headers = ['ID', '名称', '别名', '细分分类', '分类', '单位', '热量(kcal/100g)',
    '蛋白质(g/100g)', '脂肪(g/100g)', '碳水(g/100g)', '纤维(g/100g)',
    '钠(mg/100g)', '标签', '状态', '封面图URL', '创建时间', '更新时间'];
  const keys = ['id', 'name', 'alias', 'subCategory', 'category', 'unit', 'calories',
    'protein', 'fat', 'carbs', 'fiber', 'sodium', 'tags',
    'status', 'coverImage', 'createdAt', 'updatedAt'];

  const rows = ingredients.map(ing => ({
    ...ing,
    status: STATUS_MAP[String(ing.status)] || ing.status,
    tags: Array.isArray(ing.tags) ? ing.tags.join('、') : '',
    createdAt: ing.createdAt ? new Date(ing.createdAt as string).toISOString().replace('T', ' ') : '',
    updatedAt: ing.updatedAt ? new Date(ing.updatedAt as string).toISOString().replace('T', ' ') : '',
  }));

  setDownloadHeader(res, `食材_${date}.${format}`, format);

  if (format === 'csv') {
    writeCSV(res, `食材_${date}.csv`, headers, rows, keys);
  } else if (format === 'xlsx') {
    writeXLSX(res, `食材_${date}.xlsx`, '食材', headers, keys, rows);
  } else {
    // JSON: 写原始数据数组，不用包装
    res.json(ingredients);
  }
}

// ===================== 用户导出 =====================
export function exportUsers(
  res: Response,
  format: 'csv' | 'xlsx' | 'json',
  users: Record<string, unknown>[],
): void {
  const date = new Date().toISOString().slice(0, 10);
  const headers = ['ID', '昵称', '头像URL', '手机号', '性别', '生日',
    '个人简介', '账号状态', '注册平台', '注册时间', '最后登录时间',
    '最后登录IP', '收藏数', '反馈数', '备注'];
  const keys = ['id', 'nickname', 'avatar', 'phone', 'gender', 'birthday',
    'bio', 'status', 'platform', 'createdAt', 'lastLoginAt',
    'lastLoginIp', 'collectionCount', 'feedbackCount', 'remark'];

  const rows = users.map(u => ({
    ...u,
    gender: GENDER_MAP[String(u.gender)] || u.gender,
    status: ACCOUNT_STATUS_MAP[String(u.status)] || u.status,
    platform: u.lastLoginPlatform || '',
    birthday: u.birthday ? new Date(u.birthday as string).toISOString().slice(0, 10) : '',
    createdAt: u.createdAt ? String(u.createdAt).slice(0, 16).replace('T', ' ') : '',
    lastLoginAt: u.lastLoginAt ? String(u.lastLoginAt).slice(0, 16).replace('T', ' ') : '',
    remark: '',
  }));

  setDownloadHeader(res, `用户_${date}.${format}`, format);

  if (format === 'csv') {
    writeCSV(res, `用户_${date}.csv`, headers, rows, keys);
  } else if (format === 'xlsx') {
    writeXLSX(res, `用户_${date}.xlsx`, '用户', headers, keys, rows);
  } else {
    // JSON: 写原始数据数组，不用包装
    res.json(users);
  }
}

// ===================== 日志导出 =====================
export function exportLogs(
  res: Response,
  format: 'csv' | 'xlsx' | 'json',
  logs: Record<string, unknown>[],
): void {
  const date = new Date().toISOString().slice(0, 10);
  const headers = ['时间', '操作者类型', '操作者', '动作', '模块', '目标', '详情', 'IP'];
  const keys = ['createdAt', 'actorTypeText', 'actorName', 'action', 'module', 'target', 'detail', 'ip'];
  const rows = logs.map(log => ({
    ...log,
    actorTypeText: log.actorType === 'admin' ? '管理员' : '用户',
  }));

  setDownloadHeader(res, `日志_${date}.${format}`, format);

  if (format === 'csv') {
    writeCSV(res, `日志_${date}.csv`, headers, rows, keys);
  } else if (format === 'xlsx') {
    writeXLSX(res, `日志_${date}.xlsx`, '日志', headers, keys, rows);
  } else {
    res.json(logs);
  }
}
