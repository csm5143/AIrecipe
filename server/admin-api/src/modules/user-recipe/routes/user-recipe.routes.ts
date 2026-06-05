import { Router, Router as ExpressRouter } from 'express';
import { asyncHandler } from '../../../utils/helper';
import { wxAuthenticate } from '../../wx/middleware/wxAuth.middleware';
import {
  submitRecipe,
  getMyRecipes,
  getCommunityRecipes,
  getRecipeDetail,
  updateMyRecipe,
  deleteMyRecipe,
  toggleLike,
  increaseViewCount,
} from '../controllers/user-recipe.controller';

const router: ExpressRouter = Router();

router.post('/', asyncHandler(wxAuthenticate), asyncHandler(submitRecipe));
router.get('/my', asyncHandler(wxAuthenticate), asyncHandler(getMyRecipes));
router.get('/community', asyncHandler(getCommunityRecipes));
router.get('/:id', asyncHandler(getRecipeDetail));
router.put('/:id', asyncHandler(wxAuthenticate), asyncHandler(updateMyRecipe));
router.delete('/:id', asyncHandler(wxAuthenticate), asyncHandler(deleteMyRecipe));
router.post('/:id/like', asyncHandler(wxAuthenticate), asyncHandler(toggleLike));
router.post('/:id/view', asyncHandler(increaseViewCount));

export default router;
