import { Router } from 'express';
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
import { authenticate } from '../../auth/middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/banners', asyncHandler(getBanners));
router.post('/banners', asyncHandler(createBanner));
router.put('/banners/:id', asyncHandler(updateBanner));
router.delete('/banners/:id', asyncHandler(deleteBanner));

router.get('/notices', asyncHandler(getNotices));
router.get('/notices/:id', asyncHandler(getNoticeById));
router.post('/notices', asyncHandler(createNotice));
router.put('/notices/:id', asyncHandler(updateNotice));
router.delete('/notices/:id', asyncHandler(deleteNotice));

export default router;
