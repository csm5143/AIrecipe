import { Router } from 'express';
import { asyncHandler } from '../../../utils/helper';
import {
  getIngredients,
  getIngredientById,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  batchImportIngredients,
} from '../controllers/ingredient.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(getIngredients));
router.get('/:id', asyncHandler(getIngredientById));
router.post('/', asyncHandler(createIngredient));
router.put('/:id', asyncHandler(updateIngredient));
router.delete('/:id', asyncHandler(deleteIngredient));
router.post('/batch-import', asyncHandler(batchImportIngredients));

export default router;
