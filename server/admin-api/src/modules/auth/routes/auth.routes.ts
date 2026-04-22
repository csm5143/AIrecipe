import { Router } from 'express';
import { asyncHandler } from '../../../utils/helper';
import { login, logout, getProfile, refreshToken } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', asyncHandler(login));
router.post('/logout', authenticate, asyncHandler(logout));
router.get('/profile', authenticate, asyncHandler(getProfile));
router.post('/refresh-token', asyncHandler(refreshToken));

export default router;
