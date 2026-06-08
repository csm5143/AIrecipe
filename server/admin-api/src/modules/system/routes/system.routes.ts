import { Router, Router as ExpressRouter } from 'express';
import { asyncHandler } from '../../../utils/helper';
import {
  getSystemInfo,
  getAllSettings,
  getSiteSettings,
  getSeoSettings,
  getLegalSettings,
  getSecuritySettings,
  getEmailSettings,
  updateSiteSettings,
  updateSeoSettings,
  updateLegalSettings,
  updateSecuritySettings,
  updateEmailSettings,
} from '../controllers/system.controller';
import { authenticate, authorize } from '../../auth/middleware/auth.middleware';
import { sendTestEmail } from '../../../services/email.service';
import { success, badRequest } from '../../../types/response';

const router: ExpressRouter = Router();

router.get('/info', asyncHandler(getSystemInfo));

// 测试邮件（无认证要求，前端已验证登录态）
router.post('/email/test', asyncHandler(async (req, res) => {
  const email = req.body.email;
  if (!email) {
    res.status(400).json(badRequest('请填写目标邮箱地址'));
    return;
  }
  const ok = await sendTestEmail(email);
  if (ok) {
    res.json(success(null, '测试邮件已发送'));
  } else {
    res.status(500).json(badRequest('邮件发送失败，请检查 SMTP 配置'));
  }
}));

router.use(asyncHandler(authenticate));

// 基础设置：仅限 SUPER_ADMIN
router.get('/settings', asyncHandler(authorize('SUPER_ADMIN')), asyncHandler(getAllSettings));
router.get('/settings/site', asyncHandler(authorize('SUPER_ADMIN')), asyncHandler(getSiteSettings));
router.get('/settings/seo', asyncHandler(authorize('SUPER_ADMIN')), asyncHandler(getSeoSettings));
router.get('/settings/legal', asyncHandler(authorize('SUPER_ADMIN')), asyncHandler(getLegalSettings));
router.get('/settings/security', asyncHandler(authorize('SUPER_ADMIN')), asyncHandler(getSecuritySettings));
router.get('/settings/email', asyncHandler(authorize('SUPER_ADMIN')), asyncHandler(getEmailSettings));

router.put('/settings/site', asyncHandler(authorize('SUPER_ADMIN')), asyncHandler(updateSiteSettings));
router.put('/settings/seo', asyncHandler(authorize('SUPER_ADMIN')), asyncHandler(updateSeoSettings));
router.put('/settings/legal', asyncHandler(authorize('SUPER_ADMIN')), asyncHandler(updateLegalSettings));
router.put('/settings/security', asyncHandler(authorize('SUPER_ADMIN')), asyncHandler(updateSecuritySettings));
router.put('/settings/email', asyncHandler(authorize('SUPER_ADMIN')), asyncHandler(updateEmailSettings));

export default router;
