import { Router, Router as ExpressRouter } from 'express';
import { asyncHandler } from '../../../utils/helper';
import { getAppIngredients } from '../controllers/ingredient.controller';

const router: ExpressRouter = Router();
router.get('/', asyncHandler(getAppIngredients));
export default router;
