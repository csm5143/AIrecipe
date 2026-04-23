import { Router } from 'express';
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
import { authenticate } from '../../auth/middleware/auth.middleware';

const router = Router();

router.get('/info', getSystemInfo);
router.use(authenticate);

router.get('/settings', asyncHandler(getAllSettings));
router.get('/settings/site', asyncHandler(getSiteSettings));
router.get('/settings/seo', asyncHandler(getSeoSettings));
router.get('/settings/legal', asyncHandler(getLegalSettings));
router.get('/settings/security', asyncHandler(getSecuritySettings));
router.get('/settings/email', asyncHandler(getEmailSettings));

router.put('/settings/site', asyncHandler(updateSiteSettings));
router.put('/settings/seo', asyncHandler(updateSeoSettings));
router.put('/settings/legal', asyncHandler(updateLegalSettings));
router.put('/settings/security', asyncHandler(updateSecuritySettings));
router.put('/settings/email', asyncHandler(updateEmailSettings));

export default router;
