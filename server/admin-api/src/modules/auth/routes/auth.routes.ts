import { Router } from 'express';
import { asyncHandler } from '../../../utils/helper';
import { login, logout, getProfile, refreshToken, updateProfile, changePassword, updateAvatar } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', asyncHandler(login));
router.post('/logout', authenticate, asyncHandler(logout));
router.get('/profile', authenticate, asyncHandler(getProfile));
router.post('/refresh-token', asyncHandler(refreshToken));
router.put('/profile', authenticate, asyncHandler(updateProfile));
router.put('/password', authenticate, asyncHandler(changePassword));
router.put('/avatar', authenticate, asyncHandler(updateAvatar));

export default router;
