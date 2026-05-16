import { Router, Router as ExpressRouter } from 'express';
import recipeRoutes from './recipe.routes';
import favoriteRoutes from './favorite.routes';
import contentRoutes from './content.routes';
import ingredientRoutes from './ingredient.routes';

const router: ExpressRouter = Router();

router.use('/recipes', recipeRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/content', contentRoutes);
router.use('/ingredients', ingredientRoutes);

export default router;
