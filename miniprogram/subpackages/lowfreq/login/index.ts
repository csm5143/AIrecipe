// 登录页面：微信一键登录

import {
  getUserInfo,
  saveUserProfile,
  logout
} from '../../../utils/userAuth';
import {
  getUserDataFromCloud,
  restoreLocalData
} from '../../../utils/cloudUserData';
import {
  uploadAvatarToCOS
} from '../../../utils/fileUpload';
import {
  syncDebounced
} from '../../../utils/dataSync';

interface LoginResult {
  success: boolean;
  openid?: string;
  unionid?: string;
  isNewUser?: boolean;
  token?: string;
  error?: string;
}

Page({
  data: {
    userInfo: null,
    nickname: '',
    avatarUrl: '',
    guestAvatarUrl: '/assets/默认头像.png',
    hasLogin: false,
    showNicknameInput: false,
    tempNickname: '',
    isAgreed: false,
    isRestoring: false,
    loginLoading: false
  },

  onLoad() {
    this.loadUserInfo();
  },

  onShow() {
    this.loadUserInfo();
  },

  loadUserInfo() {
    const info = getUserInfo();
    const hasLogin = info.loginState && !!info.nickname;
    
    this.setData({
      userInfo: info,
      hasLogin,
      nickname: info.nickname || '',
      avatarUrl: info.avatar || ''
    });
  },

  // 切换用户协议勾选状态
  onToggleAgreement() {
    this.setData({
      isAgreed: !this.data.isAgreed
    });
  },

  // 选择头像
  onChooseAvatar(e: any) {
    const avatarUrl = e.detail.avatarUrl;
    this.setData({ avatarUrl });

    if (this.data.nickname || this.data.tempNickname) {
      const nickname = this.data.tempNickname || this.data.nickname;
      if (nickname) {
        wx.showLoading({ title: '上传头像中...' });

        wx.getFileSystemManager().readFile({
          filePath: avatarUrl,
          encoding: 'base64',
          success: (res: any) => {
            const fileBuffer = res.data as string;
            uploadAvatarToCOS(fileBuffer).then(cosUrl => {
              wx.hideLoading();

              if (cosUrl) {
                const info = saveUserProfile(nickname, cosUrl);
                this.setData({
                  userInfo: info,
                  hasLogin: true,
                  avatarUrl: cosUrl
                });
                syncDebounced();
                wx.showToast({ title: '头像已更新', icon: 'success' });
              } else {
                const info = saveUserProfile(nickname, '');
                this.setData({
                  userInfo: info,
                  hasLogin: true
                });
                wx.showToast({ title: '头像上传失败', icon: 'none' });
              }
            }).catch(err => {
              wx.hideLoading();
              console.error('[Login] 头像上传COS失败', err);
              const info = saveUserProfile(nickname, '');
              this.setData({
                userInfo: info,
                hasLogin: true
              });
              wx.showToast({ title: '头像上传失败', icon: 'none' });
            });
          },
          fail: (err) => {
            wx.hideLoading();
            console.error('[Login] 读取头像文件失败', err);
            wx.showToast({ title: '头像保存失败', icon: 'none' });
          }
        });
      }
    }
  },

  // 输入昵称
  onNicknameInput(e: any) {
    this.setData({
      tempNickname: e.detail.value
    });
  },

  // 清空昵称
  onClearNickname() {
    this.setData({
      tempNickname: ''
    });
  },

  // 微信一键登录（核心改进：不再需要手机号授权）
  async onWechatLogin() {
    // 检查协议
    if (!this.data.isAgreed) {
      wx.showToast({
        title: '请阅读并勾选用户协议',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    this.setData({ loginLoading: true });
    wx.showLoading({ title: '登录中...', mask: true });

    try {
      // 1. 获取微信登录凭证
      const loginResult = await this.wxLogin();
      if (!loginResult.code) {
        throw new Error('微信登录失败');
      }

      // 2. 调用云函数进行登录（纯 openid 登录）
      // #region debug log hypothesis B
      fetch('http://127.0.0.1:7659/ingest/62624b2e-6afb-4a90-931b-dedcd7320e0a', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '674cb7' },
        body: JSON.stringify({
          sessionId: '674cb7',
          location: 'login/index.ts:onWechatLogin:CLOUD_CALL_START',
          message: 'Cloud function call initiating',
          data: { functionName: 'login', code: loginResult.code ? 'present' : 'missing' },
          runId: 'run1',
          hypothesisId: 'B',
          timestamp: Date.now()
        })
      }).catch(() => {});
      // #endregion

      let cloudRes: any;
      try {
        cloudRes = await wx.cloud.callFunction({
          name: 'login',
          data: {
            code: loginResult.code
          }
        });

        // #region debug log hypothesis B
        fetch('http://127.0.0.1:7659/ingest/62624b2e-6afb-4a90-931b-dedcd7320e0a', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '674cb7' },
          body: JSON.stringify({
            sessionId: '674cb7',
            location: 'login/index.ts:onWechatLogin:CLOUD_CALL_SUCCESS',
            message: 'Cloud function call succeeded',
            data: { functionName: 'login', resultKeys: cloudRes ? Object.keys(cloudRes) : [] },
            runId: 'run1',
            hypothesisId: 'B',
            timestamp: Date.now()
          })
        }).catch(() => {});
        // #endregion
      } catch (cloudErr: any) {
        // #region debug log hypothesis B
        fetch('http://127.0.0.1:7659/ingest/62624b2e-6afb-4a90-931b-dedcd7320e0a', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '674cb7' },
          body: JSON.stringify({
            sessionId: '674cb7',
            location: 'login/index.ts:onWechatLogin:CLOUD_CALL_ERROR',
            message: 'Cloud function call failed',
            data: { functionName: 'login', error: cloudErr.message, errMsg: cloudErr.errMsg, stack: cloudErr.stack },
            runId: 'run1',
            hypothesisId: 'B',
            timestamp: Date.now()
          })
        }).catch(() => {});
        // #endregion
        throw cloudErr;
      }

      const result = cloudRes.result as LoginResult;
      
      if (!result.success) {
        throw new Error(result.error || '登录失败');
      }

      const { openid, token, isNewUser } = result;

      // 3. 保存用户信息
      const nickname = this.data.tempNickname.trim() || this.data.nickname;
      const avatarRaw = this.data.avatarUrl || '';
      const avatar = avatarRaw.startsWith('http') && !avatarRaw.includes('127.0.0.1') && !avatarRaw.includes('localhost') ? avatarRaw : '';
      const finalNickname = nickname || '美食家' + Math.floor(Math.random() * 9000 + 1000);

      // 保存用户信息
      const info = saveUserProfile(finalNickname, avatar, openid);

      // 保存 openid 和 token
      wx.setStorageSync('savedOpenid', openid);
      if (token) {
        wx.setStorageSync('authToken', token);
      }

      // 4. 恢复云端数据
      await this.doRestoreCloudData(openid);

      wx.hideLoading();
      this.setData({ loginLoading: false });

      wx.showToast({
        title: isNewUser ? '注册成功' : '登录成功',
        icon: 'success'
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 1500);

    } catch (err: any) {
      console.error('[Login] 微信登录失败', err);
      wx.hideLoading();
      this.setData({ loginLoading: false });
      wx.showToast({
        title: err.message || '登录失败，请重试',
        icon: 'none'
      });
    }
  },

  // 微信登录获取 code
  wxLogin(): Promise<{ code: string; errMsg: string }> {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (res.code) {
            resolve({ code: res.code, errMsg: res.errMsg });
          } else {
            reject(new Error('未获取到登录凭证'));
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  },

  // 从云端恢复用户数据
  async doRestoreCloudData(openid: string) {
    try {
      // 1. 恢复旧版用户数据
      const cloudData = await getUserDataFromCloud();
      if (cloudData) {
        restoreLocalData(cloudData);
        console.log('[Login] 旧版云端数据已恢复', cloudData);
      }

      // 2. 恢复新版收藏夹数据
      const { pullCollectionsFromCloud } = require('../../../utils/cloudCollections');
      const pullResult = await pullCollectionsFromCloud();
      console.log('[Login] 收藏夹数据拉取结果:', pullResult);

      if (pullResult.success && pullResult.collectionsPulled > 0) {
        console.log(`[Login] 成功拉取 ${pullResult.collectionsPulled} 个收藏夹，${pullResult.favoritesPulled} 条收藏记录`);
      }
    } catch (e) {
      console.warn('[Login] 恢复云端数据失败', e);
    }
  },

  // 显示昵称输入框
  onShowNicknameInput() {
    this.setData({
      showNicknameInput: true,
      tempNickname: this.data.nickname || ''
    });
  },

  // 确认保存昵称
  onConfirmNickname() {
    const nickname = this.data.tempNickname.trim();

    if (!nickname) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      });
      return;
    }

    if (nickname.length > 20) {
      wx.showToast({
        title: '昵称过长',
        icon: 'none'
      });
      return;
    }

    const avatarRaw = this.data.avatarUrl || '';
    const avatar = avatarRaw.startsWith('http') && !avatarRaw.includes('127.0.0.1') && !avatarRaw.includes('localhost') ? avatarRaw : '';

    const info = saveUserProfile(nickname, avatar);
    this.setData({
      userInfo: info,
      nickname: info.nickname,
      showNicknameInput: false
    });

    syncDebounced();

    wx.showToast({
      title: '保存成功',
      icon: 'success'
    });
  },

  // 取消编辑昵称
  onCancelNickname() {
    this.setData({ showNicknameInput: false });
  },

  // 阻止默认事件
  preventTouchMove() {
    return false;
  },

  // 退出登录
  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？\n\n退出后，下次使用微信登录仍可恢复您的账号数据',
      success: (res) => {
        if (res.confirm) {
          const info = getUserInfo();
          const savedOpenid = info.openid || '';
          const savedToken = wx.getStorageSync('authToken');

          logout();

          // 保留 openid 和 token 以便重新登录
          if (savedOpenid) {
            wx.setStorageSync('savedOpenid', savedOpenid);
          }
          if (savedToken) {
            wx.setStorageSync('authToken', savedToken);
          }

          this.setData({
            userInfo: null,
            hasLogin: false,
            nickname: '',
            avatarUrl: '',
            isAgreed: false
          });
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  },

  // 查看用户协议
  onViewAgreement() {
    wx.showModal({
      title: '用户协议',
      content: `AI智能菜谱用户服务协议

一、服务说明

"吃了么"AI智能菜谱是一款帮助用户发现食材做法、推荐菜谱的应用程序。

二、账号注册

1. 您使用微信账号一键注册，无需设置密码
2. 一个微信账号绑定一个用户账号

三、使用规则

1. 您同意并承诺按照本协议使用本服务
2. 您承诺遵守当地法律法规
3. 您理解菜谱内容仅供参考

四、免责声明

1. 菜谱内容仅供参考，使用前请确保食材新鲜
2. 如有过敏史请在使用前咨询专业人士
3. 因使用本服务产生的任何损失，本平台不承担责任

五、账号管理

1. 您可以随时退出登录，账号永久保留
2. 账号数据将同步至云端，可在多设备登录`,
      showCancel: false,
      confirmText: '我知道了'
    });
  },

  // 查看隐私政策
  onViewPrivacy() {
    wx.showModal({
      title: '隐私政策',
      content: `AI智能菜谱隐私政策

一、信息收集

1. 头像和昵称：您主动选择上传的内容
2. 微信账号信息：通过微信授权获取，用于账号绑定
3. 收藏记录：您主动收藏的菜谱数据
4. 使用信息：帮助我们优化服务

二、信息使用

1. 您的微信账号用于账号绑定，一个微信一个账号
2. 您的信息将用于提供个性化服务和保存您的偏好设置
3. 我们不会将您的信息用于商业广告推送

三、信息存储

1. 您的信息关联到您的微信账号，可在云端安全存储
2. 数据采用加密存储，保障信息安全
3. 您可以随时退出登录，账号数据永久保留

四、信息保护

1. 我们采用业界标准的安全措施保护您的信息
2. 未经您的授权，我们不会向第三方披露您的个人信息
3. 如有安全事件，我们将及时通知您

五、联系我们

如对隐私政策有任何疑问，请联系：contact@airecipe.com`,
      showCancel: false,
      confirmText: '我知道了'
    });
  }
});
