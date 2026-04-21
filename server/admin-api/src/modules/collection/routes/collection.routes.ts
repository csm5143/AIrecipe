import { Router } from 'express';
import { asyncHandler } from '../../utils/helper';
import { getCollections } from '../controllers/collection.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(getCollections));

export default router;
