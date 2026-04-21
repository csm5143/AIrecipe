import { Router } from 'express';
import { asyncHandler } from '../../utils/helper';
import { getBanners, createBanner, updateBanner, deleteBanner } from '../controllers/content.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/banners', asyncHandler(getBanners));
router.post('/banners', asyncHandler(createBanner));
router.put('/banners/:id', asyncHandler(updateBanner));
router.delete('/banners/:id', asyncHandler(deleteBanner));

export default router;
