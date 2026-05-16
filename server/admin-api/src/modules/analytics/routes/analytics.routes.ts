import { Router, Router as ExpressRouter } from 'express';
import { asyncHandler } from '../../../utils/helper';
import { getDashboardStats, getUserStats, getRecipeStats, getFeedbackStats, getRecipeCategoryStats } from '../controllers/analytics.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';

const router: ExpressRouter = Router();
router.use(asyncHandler(authenticate));

router.get('/dashboard', asyncHandler(getDashboardStats));
router.get('/users', asyncHandler(getUserStats));
router.get('/recipes', asyncHandler(getRecipeStats));
router.get('/feedbacks', asyncHandler(getFeedbackStats));
router.get('/category-stats', asyncHandler(getRecipeCategoryStats));

export default router;
