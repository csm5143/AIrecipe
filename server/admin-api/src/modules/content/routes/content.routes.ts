import { Router, Router as ExpressRouter } from 'express';
import { asyncHandler } from '../../../utils/helper';
import {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  getNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice,
} from '../controllers/content.controller';
import { authenticate, authorize } from '../../auth/middleware/auth.middleware';

const router: ExpressRouter = Router();
router.use(asyncHandler(authenticate));

// 内容运营：SUPER_ADMIN / ADMIN 可访问
router.get('/banners', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN')), asyncHandler(getBanners));
router.post('/banners', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN')), asyncHandler(createBanner));
router.put('/banners/:id', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN')), asyncHandler(updateBanner));
router.delete('/banners/:id', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN')), asyncHandler(deleteBanner));

router.get('/notices', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN')), asyncHandler(getNotices));
router.get('/notices/:id', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN')), asyncHandler(getNoticeById));
router.post('/notices', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN')), asyncHandler(createNotice));
router.put('/notices/:id', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN')), asyncHandler(updateNotice));
router.delete('/notices/:id', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN')), asyncHandler(deleteNotice));

export default router;
