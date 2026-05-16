import { Router, Router as ExpressRouter } from 'express';
import { asyncHandler } from '../../../utils/helper';
import { login, logout, getProfile, refreshToken, updateProfile, changePassword, updateAvatar } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router: ExpressRouter = Router();

router.post('/login', asyncHandler(login));
router.post('/logout', asyncHandler(authenticate), asyncHandler(logout));
router.get('/profile', asyncHandler(authenticate), asyncHandler(getProfile));
router.post('/refresh-token', asyncHandler(refreshToken));
router.put('/profile', asyncHandler(authenticate), asyncHandler(updateProfile));
router.put('/password', asyncHandler(authenticate), asyncHandler(changePassword));
router.put('/avatar', asyncHandler(authenticate), asyncHandler(updateAvatar));

export default router;
