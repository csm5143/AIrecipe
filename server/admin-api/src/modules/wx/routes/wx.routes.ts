import { Router, Router as ExpressRouter } from 'express';
import { asyncHandler } from '../../../utils/helper';
import {
  wxLogin,
  bindPhone,
  getWxUserInfo,
  updateWxUserInfo,
} from '../controllers/wx.controller';
import { wxAuthenticate } from '../middleware/wxAuth.middleware';
import appWxRoutes from './app.routes';

const router: ExpressRouter = Router();

router.post('/login', asyncHandler(wxLogin));
router.post('/bind-phone', wxAuthenticate, asyncHandler(bindPhone));
router.get('/userinfo', wxAuthenticate, asyncHandler(getWxUserInfo));
router.put('/userinfo', wxAuthenticate, asyncHandler(updateWxUserInfo));

// 小程序用户端 API（需登录）
router.use('/app', appWxRoutes);

export default router;
