import { Router } from 'express';
import { asyncHandler } from '../../utils/helper';
import {
  getRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  batchDeleteRecipes,
} from '../controllers/recipe.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(getRecipes));
router.get('/:id', asyncHandler(getRecipeById));
router.post('/', asyncHandler(createRecipe));
router.put('/:id', asyncHandler(updateRecipe));
router.delete('/:id', asyncHandler(deleteRecipe));
router.post('/batch-delete', asyncHandler(batchDeleteRecipes));

export default router;
