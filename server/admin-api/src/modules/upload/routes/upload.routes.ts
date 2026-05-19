import { Router, Router as ExpressRouter } from 'express';
import { asyncHandler } from '../../../utils/helper';
import {
  uploadMiddleware,
  uploadFile,
  uploadScanImage,
  uploadAdminAvatar,
  uploadUserAvatar,
  uploadIngredient,
  uploadCategoryIcon,
  uploadFeedback,
  uploadSettings,
} from '../controllers/upload.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';

const router: ExpressRouter = Router();

router.post('/', asyncHandler(authenticate), uploadMiddleware, asyncHandler(uploadFile));
router.post('/scan', uploadMiddleware, asyncHandler(uploadScanImage));
router.post('/admin-avatar', asyncHandler(authenticate), uploadMiddleware, asyncHandler(uploadAdminAvatar));
router.post('/avatar', asyncHandler(authenticate), uploadMiddleware, asyncHandler(uploadUserAvatar));
router.post('/ingredient', asyncHandler(authenticate), uploadMiddleware, asyncHandler(uploadIngredient));
router.post('/category-icon', asyncHandler(authenticate), uploadMiddleware, asyncHandler(uploadCategoryIcon));
router.post('/feedback', asyncHandler(authenticate), uploadMiddleware, asyncHandler(uploadFeedback));
router.post('/settings', asyncHandler(authenticate), uploadMiddleware, asyncHandler(uploadSettings));

export default router;
