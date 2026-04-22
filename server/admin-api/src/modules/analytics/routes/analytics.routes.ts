import { Router } from 'express';
import { asyncHandler } from '../../../utils/helper';
import { getDashboardStats, getUserStats, getRecipeStats, getFeedbackStats } from '../controllers/analytics.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/dashboard', asyncHandler(getDashboardStats));
router.get('/users', asyncHandler(getUserStats));
router.get('/recipes', asyncHandler(getRecipeStats));
router.get('/feedbacks', asyncHandler(getFeedbackStats));

export default router;
