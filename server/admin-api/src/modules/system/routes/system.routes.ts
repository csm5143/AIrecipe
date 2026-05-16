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

const router: ExpressRouter = Router();

router.get('/info', asyncHandler(getSystemInfo));
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
