import { Router } from 'express';
import { asyncHandler } from '../../../utils/helper';
import { uploadFile } from '../controllers/upload.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, asyncHandler(uploadFile));

export default router;
