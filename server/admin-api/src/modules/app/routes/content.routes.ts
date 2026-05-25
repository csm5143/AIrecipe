import { Router, Router as ExpressRouter } from 'express';
import { asyncHandler } from '../../../utils/helper';
import {
  getBanners,
  getNotices,
  getHomeData,
  getCards,
  getDailyRecommend,
} from '../controllers/content.controller';

const router: ExpressRouter = Router();

router.get('/banners', asyncHandler(getBanners));
router.get('/notices', asyncHandler(getNotices));
router.get('/home', asyncHandler(getHomeData));
router.get('/cards', asyncHandler(getCards));
router.get('/daily-recommend', asyncHandler(getDailyRecommend));

export default router;
