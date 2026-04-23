import { Router } from 'express';
import { asyncHandler } from '../../../utils/helper';
import { uploadMiddleware, uploadFile } from '../controllers/upload.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, uploadMiddleware, asyncHandler(uploadFile));

export default router;
