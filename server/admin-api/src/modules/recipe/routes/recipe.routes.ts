import { Router, Router as ExpressRouter } from 'express';
import { asyncHandler } from '../../../utils/helper';
import {
  getRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  batchDeleteRecipes,
  batchUpdateRecipes,
  publishRecipe,
  offlineRecipe,
  importRecipes,
  exportRecipesHandler,
} from '../controllers/recipe.controller';
import { authenticate, authorize } from '../../auth/middleware/auth.middleware';

const router: ExpressRouter = Router();
router.use(asyncHandler(authenticate));

// 菜谱列表/详情：SUPER_ADMIN / ADMIN / EDITOR / AUDITOR 均可查看
router.get('/', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUDITOR')), asyncHandler(getRecipes));
router.get('/export', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUDITOR')), asyncHandler(exportRecipesHandler));
router.get('/:id', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUDITOR')), asyncHandler(getRecipeById));

// 菜谱增删改（发布/下架/导入）：SUPER_ADMIN / ADMIN / EDITOR
router.post('/', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR')), asyncHandler(createRecipe));
router.put('/:id', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR')), asyncHandler(updateRecipe));
router.delete('/:id', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR')), asyncHandler(deleteRecipe));
router.post('/batch-delete', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR')), asyncHandler(batchDeleteRecipes));
router.patch('/batch', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR')), asyncHandler(batchUpdateRecipes));
router.post('/:id/publish', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR')), asyncHandler(publishRecipe));
router.post('/:id/offline', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR')), asyncHandler(offlineRecipe));
router.post('/import', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR')), asyncHandler(importRecipes));

export default router;
