import { Router, Router as ExpressRouter } from 'express';
import { asyncHandler } from '../../../utils/helper';
import {
  getAppRecipes,
  getAppRecipeById,
  getCategories,
  getRecipesByIngredients,
} from '../controllers/recipe.controller';

const router: ExpressRouter = Router();

router.get('/', asyncHandler(getAppRecipes));
router.get('/categories', asyncHandler(getCategories));
router.get('/by-ingredients', asyncHandler(getRecipesByIngredients));
router.get('/:id', asyncHandler(getAppRecipeById));

export default router;
