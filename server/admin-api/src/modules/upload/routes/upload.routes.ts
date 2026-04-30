import { Router, Router as ExpressRouter } from 'express';
import { asyncHandler } from '../../../utils/helper';
import { uploadMiddleware, uploadFile } from '../controllers/upload.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';

const router: ExpressRouter = Router();

router.post('/', authenticate, uploadMiddleware, asyncHandler(uploadFile));

export default router;
