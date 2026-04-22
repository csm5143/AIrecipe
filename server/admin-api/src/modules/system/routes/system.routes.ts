import { Router } from 'express';
import { asyncHandler } from '../../../utils/helper';
import { getSystemInfo } from '../controllers/system.controller';

const router = Router();

router.get('/info', asyncHandler(getSystemInfo));

export default router;
