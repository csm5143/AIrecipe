import { Router, Router as ExpressRouter } from 'express';
import { asyncHandler } from '../../../utils/helper';
import {
  getIngredients,
  getIngredientById,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  previewImportIngredients,
  batchImportIngredients,
  batchDeleteIngredients,
  exportIngredientsHandler,
} from '../controllers/ingredient.controller';
import { authenticate, authorize } from '../../auth/middleware/auth.middleware';

const router: ExpressRouter = Router();
router.use(asyncHandler(authenticate));

// 食材库：SUPER_ADMIN / ADMIN / EDITOR 可操作；AUDITOR 仅可查看
router.get('/', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUDITOR')), asyncHandler(getIngredients));
router.get('/export', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUDITOR')), asyncHandler(exportIngredientsHandler));
router.get('/:id', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUDITOR')), asyncHandler(getIngredientById));
router.post('/', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR')), asyncHandler(createIngredient));
router.put('/:id', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR')), asyncHandler(updateIngredient));
router.delete('/:id', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR')), asyncHandler(deleteIngredient));
router.post('/batch-import/preview', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR')), asyncHandler(previewImportIngredients));
router.post('/batch-import', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR')), asyncHandler(batchImportIngredients));
router.post('/batch-delete', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR')), asyncHandler(batchDeleteIngredients));

export default router;
