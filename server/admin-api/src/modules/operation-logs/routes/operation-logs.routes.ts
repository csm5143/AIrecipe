import { Router, Router as ExpressRouter } from 'express';
import { asyncHandler } from '../../../utils/helper';
import { getOperationLogs } from '../controllers/operation-logs.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';

const router: ExpressRouter = Router();
router.use(asyncHandler(authenticate));

router.get('/', asyncHandler(getOperationLogs));

export default router;
