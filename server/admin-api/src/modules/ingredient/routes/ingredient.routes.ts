import { Router } from 'express';
import { asyncHandler } from '../../utils/helper';
import { getIngredients, createIngredient } from '../controllers/ingredient.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(getIngredients));
router.post('/', asyncHandler(createIngredient));

export default router;
