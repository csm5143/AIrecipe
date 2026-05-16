import { Router, Router as ExpressRouter } from 'express';
import { asyncHandler } from '../../../utils/helper';
import {
  getBanners,
  getNotices,
  getHomeData,
} from '../controllers/content.controller';

const router: ExpressRouter = Router();

router.get('/banners', asyncHandler(getBanners));
router.get('/notices', asyncHandler(getNotices));
router.get('/home', asyncHandler(getHomeData));

export default router;
