import { Router } from 'express';
import { asyncHandler } from '../../../utils/helper';
import { getAppIngredients } from '../controllers/ingredient.controller';

const router = Router();
router.get('/', asyncHandler(getAppIngredients));
export default router;
