import { Router, Router as ExpressRouter } from 'express';
import { asyncHandler } from '../../../utils/helper';
import {
  getPendingRecipes,
  getProcessedRecipes,
  getRecipeDetail,
  auditRecipe
} from '../controllers/recipe-audit.controller';
import { authenticate, authorize } from '../../auth/middleware/auth.middleware';

const router: ExpressRouter = Router();
router.use(asyncHandler(authenticate));

// 菜谱审核：AUDITOR 和更高角色可访问
router.get('/pending', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'AUDITOR')), asyncHandler(getPendingRecipes));
router.get('/processed', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'AUDITOR')), asyncHandler(getProcessedRecipes));
router.get('/:id', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'AUDITOR')), asyncHandler(getRecipeDetail));
router.post('/:id/review', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'AUDITOR')), asyncHandler(auditRecipe));

export default router;
