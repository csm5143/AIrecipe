/** 开发辅助：读取小程序源码供管理后台预览 */
import { Router } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { asyncHandler } from '../../../utils/helper';
import { success, badRequest } from '../../../types/response';
import { authenticate, authorize } from '../../auth/middleware/auth.middleware';

const router = Router();

// 源码读取需要鉴权
const authMw = [asyncHandler(authenticate), asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR'))];

// Find project root by walking up from __dirname until we find client/miniprogram
function findMiniRoot(): string {
  let dir = __dirname;
  for (let i = 0; i < 10; i++) {
    const candidate = path.join(dir, 'client', 'miniprogram');
    if (fs.existsSync(candidate)) return candidate;
    dir = path.dirname(dir);
  }
  // Fallback: assume running from server/admin-api
  return path.resolve(__dirname, '../../../../client/miniprogram');
}
const MINI_ROOT = findMiniRoot();

// 允许读取的文件白名单
const ALLOWED_FILES: Record<string, { wxml: string; wxss: string; label: string }> = {
  home:     { wxml: 'pages/index/index.wxml',        wxss: 'pages/index/index.wxss',        label: '首页' },
  custom:   { wxml: 'pages/custom/index.wxml',       wxss: 'pages/custom/index.wxss',       label: '定制页' },
  mine:     { wxml: 'pages/mine/index.wxml',          wxss: 'pages/mine/index.wxss',          label: '我的' },
  search:   { wxml: 'pages/search/index.wxml',        wxss: 'pages/search/index.wxss',        label: '搜索' },
  detail:   { wxml: 'pages/recipes/detail/index.wxml',wxss: 'pages/recipes/detail/index.wxss',label: '详情' },
  list:     { wxml: 'pages/recipes/list/index.wxml',  wxss: 'pages/recipes/list/index.wxss',  label: '列表' },
};

router.get('/page-source', ...authMw, asyncHandler(async (req, res) => {
  const pageId = req.query.page as string;
  const file = ALLOWED_FILES[pageId];
  if (!file) {
    res.status(400).json(badRequest('无效页面ID，可选: ' + Object.keys(ALLOWED_FILES).join(', ')));
    return;
  }

  const wxmlPath = path.join(MINI_ROOT, file.wxml);
  const wxssPath = path.join(MINI_ROOT, file.wxss);

  if (!fs.existsSync(wxmlPath)) {
    res.status(404).json(badRequest('WXML 文件不存在: ' + file.wxml));
    return;
  }

  const wxml = fs.readFileSync(wxmlPath, 'utf-8');
  const wxss = fs.existsSync(wxssPath) ? fs.readFileSync(wxssPath, 'utf-8') : '';

  res.json(success({ wxml, wxss, label: file.label, pageId }));
}));

router.get('/page-list', ...authMw, asyncHandler(async (_req, res) => {
  const list = Object.entries(ALLOWED_FILES).map(([id, f]) => ({ id, label: f.label }));
  res.json(success(list));
}));

// 提供本地 assets 文件（图标等），避免预览时图标缺失
router.get('/asset', asyncHandler(async (req, res) => {
  const assetPath = req.query.path as string;
  if (!assetPath || assetPath.includes('..')) {
    res.status(400).json(badRequest('无效路径'));
    return;
  }
  const fullPath = path.join(MINI_ROOT, 'assets', assetPath);
  if (!fs.existsSync(fullPath)) {
    res.status(404).json(badRequest('文件不存在'));
    return;
  }
  res.sendFile(fullPath);
}));

export default router;
