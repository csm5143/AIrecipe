import { Router, Router as ExpressRouter } from 'express';
import { asyncHandler } from '../../../utils/helper';
import {
  wxLogin,
  sendCode,
  accountLogin,
  accountRegister,
  resetPassword,
  phoneLogin,
  phoneRegister,
  bindPhone,
  bindEmail,
  getWxUserInfo,
  updateWxUserInfo,
  changePassword,
} from '../controllers/wx.controller';
import { wxAuthenticate } from '../middleware/wxAuth.middleware';
import appWxRoutes from './app.routes';

const router: ExpressRouter = Router();

router.post('/login', asyncHandler(wxLogin));
router.post('/send-code', asyncHandler(sendCode));
router.post('/account-login', asyncHandler(accountLogin));
router.post('/account-register', asyncHandler(accountRegister));
router.post('/reset-password', asyncHandler(resetPassword));
router.post('/phone-login', asyncHandler(phoneLogin));
router.post('/phone-register', asyncHandler(phoneRegister));
router.post('/bind-phone', wxAuthenticate, asyncHandler(bindPhone));
router.post('/bind-email', wxAuthenticate, asyncHandler(bindEmail));
router.get('/userinfo', wxAuthenticate, asyncHandler(getWxUserInfo));
router.put('/userinfo', wxAuthenticate, asyncHandler(updateWxUserInfo));
router.put('/change-password', wxAuthenticate, asyncHandler(changePassword));
router.use('/app', appWxRoutes);

export default router;
