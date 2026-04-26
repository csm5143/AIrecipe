import { Router } from 'express';
import { asyncHandler } from '../../../utils/helper';
import { 
  getPendingRecipes, 
  getProcessedRecipes, 
  getRecipeDetail,
  auditRecipe 
} from '../controllers/recipe-audit.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/pending', asyncHandler(getPendingRecipes));
router.get('/processed', asyncHandler(getProcessedRecipes));
router.get('/:id', asyncHandler(getRecipeDetail));
router.post('/:id/review', asyncHandler(auditRecipe));

export default router;
