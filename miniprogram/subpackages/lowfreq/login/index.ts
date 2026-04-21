// 登录页面：微信一键登录 + 昵称头像设置
// 核心改进：使用 openid 作为唯一身份标识，支持跨设备/跨缓存持久登录

import {
  getUserInfo,
  saveUserProfile,
  logout,
  isLoggedIn,
  getUserIdentifier,
  getUserType
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

Page({
  data: {
    userInfo: null,
    nickname: '',
    avatarUrl: '',
    guestAvatarUrl: '/assets/默认头像.png',
    isGuest: false,
    hasLogin: false,
    showNicknameInput: false,
    tempNickname: '',
    isAgreed: false,
    isRestoring: false  // 是否正在恢复云端数据
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
      isGuest: hasLogin && info.isGuest === true,
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
  onChooseAvatar(e: WechatMiniprogram.BaseEvent) {
    const avatarUrl = e.detail.avatarUrl;
    this.setData({ avatarUrl });

    if (this.data.nickname || this.data.tempNickname) {
      const nickname = this.data.tempNickname || this.data.nickname;
      if (nickname) {
        wx.showLoading({ title: '上传头像中...' });

        // 读取文件并转为 Base64
        wx.getFileSystemManager().readFile({
          filePath: avatarUrl,
          encoding: 'base64',
          success: (res) => {
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
                // 上传失败，不保存本地路径，保持原来的头像
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
              // 上传失败，不保存本地路径
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
  onNicknameInput(e: WechatMiniprogram.Input) {
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

  // 微信一键登录（勾选协议即可：昵称头像选填，未填则自动生成）
  // 核心改进：使用 openid 作为唯一身份标识，支持跨缓存持久登录
  onQuickLogin() {
    if (!this.data.isAgreed) {
      wx.showToast({
        title: '请阅读并勾选用户协议',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 如果已有登录状态且有 openid，先尝试从云端恢复数据
    const existingInfo = getUserInfo();
    const existingType = getUserType();

    if (existingType === 'user' && existingInfo.openid) {
      // 已登录过的正式用户，直接从云端恢复数据
      this.restoreCloudData(() => {
        this.finishLogin(existingInfo.nickname, existingInfo.avatar);
      });
      return;
    }

    // 新用户或无 openid 的用户，需要先通过云函数获取 openid
    this.getOpenIdAndLogin();
  },

  // 通过云函数获取 openid 并完成登录
  getOpenIdAndLogin() {
    wx.showLoading({ title: '登录中...', mask: true });

    // 先调用 wx.login 获取 code
    wx.login({
      success: async (loginRes) => {
        if (!loginRes.code) {
          wx.hideLoading();
          wx.showToast({ title: '登录失败，请重试', icon: 'none' });
          return;
        }

        try {
          // 调用云函数，通过 code 换取 openid
          const cloudRes = await wx.cloud.callFunction({
            name: 'login',
            data: { code: loginRes.code }
          });

          const openid = (cloudRes.result && cloudRes.result.openid) ? cloudRes.result.openid : cloudRes.openid;
          if (!openid) {
            throw new Error('未获取到 openid');
          }

          const nickname = this.data.tempNickname.trim() || this.data.nickname;
          // 只有 COS URL 才保存，本地临时路径忽略
          const avatarRaw = this.data.avatarUrl || '';
          const avatar = avatarRaw.startsWith('http') && !avatarRaw.includes('127.0.0.1') && !avatarRaw.includes('localhost') ? avatarRaw : '';
          const finalNickname = nickname || '美食家' + Math.floor(Math.random() * 9000 + 1000);

          // 保存用户信息（包含 openid）
          const info = saveUserProfile(finalNickname, avatar, false, openid);

          // 保存 openid 到单独存储（退出登录后保留）
          wx.setStorageSync('savedOpenid', openid);

          // 尝试从云端恢复数据
          await this.doRestoreCloudData(openid);

          wx.hideLoading();
          this.finishLogin(info.nickname, info.avatar);

        } catch (cloudErr: any) {
          console.warn('[Login] 获取 openid 失败，使用本地登录', cloudErr);

          // 降级：使用本地 openid（如果已有）
          const existingInfo = getUserInfo();
          const fallbackOpenid = existingInfo.openid || `local_${Date.now()}`;
          const nickname = this.data.tempNickname.trim() || this.data.nickname;
          // 只有 COS URL 才保存，本地临时路径忽略
          const avatarRaw = this.data.avatarUrl || '';
          const avatar = avatarRaw.startsWith('http') && !avatarRaw.includes('127.0.0.1') && !avatarRaw.includes('localhost') ? avatarRaw : '';
          const finalNickname = nickname || '美食家' + Math.floor(Math.random() * 9000 + 1000);

          const info = saveUserProfile(finalNickname, avatar, false, fallbackOpenid);
          wx.setStorageSync('savedOpenid', fallbackOpenid);

          wx.hideLoading();
          this.finishLogin(info.nickname, info.avatar);
        }
      },
      fail: (loginErr) => {
        wx.hideLoading();
        console.error('[Login] wx.login 失败', loginErr);
        wx.showToast({ title: '网络异常，请重试', icon: 'none' });
      }
    });
  },

  // 从云端恢复用户数据（包含收藏夹）
  async doRestoreCloudData(openid: string) {
    try {
      // 1. 恢复旧版用户数据（收藏、小菜篮等）
      const cloudData = await getUserDataFromCloud();
      if (cloudData) {
        restoreLocalData(cloudData);
        console.log('[Login] 旧版云端数据已恢复', cloudData);
      }

      // 2. 恢复新版收藏夹数据（从 collections 和 favorites 集合拉取）
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

  // 恢复云端数据的封装方法（带 UI 反馈）
  async restoreCloudData(callback?: () => void) {
    this.setData({ isRestoring: true });

    try {
      const identifier = getUserIdentifier();
      if (!identifier) {
        this.setData({ isRestoring: false });
        if (callback) callback();
        return;
      }

      // 1. 恢复旧版用户数据
      const cloudData = await getUserDataFromCloud();
      if (cloudData) {
        restoreLocalData(cloudData);
        console.log('[Login] 旧版云端数据已恢复');
      }

      // 2. 恢复新版收藏夹数据
      const { pullCollectionsFromCloud } = require('../../../utils/cloudCollections');
      const pullResult = await pullCollectionsFromCloud();
      console.log('[Login] 收藏夹数据拉取结果:', pullResult);

      if (pullResult.success && pullResult.collectionsPulled > 0) {
        wx.showToast({ title: '收藏夹已同步', icon: 'success', duration: 1500 });
      } else {
        console.log('[Login] 云端暂无收藏夹数据');
      }
    } catch (e) {
      console.warn('[Login] 恢复云端数据失败', e);
    }

    this.setData({ isRestoring: false });
    if (callback) callback();
  },

  // 完成登录（统一处理）
  finishLogin(nickname: string, avatar: string) {
    this.setData({
      userInfo: getUserInfo(),
      hasLogin: true,
      nickname: nickname
    });

    wx.showToast({
      title: '登录成功',
      icon: 'success'
    });

    setTimeout(() => {
      wx.navigateBack();
    }, 1500);
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

    // 只有 COS URL 才保存，本地临时路径忽略
    const avatarRaw = this.data.avatarUrl || '';
    const avatar = avatarRaw.startsWith('http') && !avatarRaw.includes('127.0.0.1') && !avatarRaw.includes('localhost') ? avatarRaw : '';

    const info = saveUserProfile(nickname, avatar);
    this.setData({
      userInfo: info,
      nickname: info.nickname,
      showNicknameInput: false
    });

    // 同步昵称到云端
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

  // 游客登录
  onSkip() {
    const defaultNickname = '美食探索者' + Math.floor(Math.random() * 9000 + 1000);
    const info = saveUserProfile(defaultNickname, '', true);

    this.setData({
      userInfo: info,
      hasLogin: true,
      isGuest: true,
      nickname: info.nickname,
      showNicknameInput: false
    });

    wx.showToast({
      title: '登录成功',
      icon: 'success'
    });

    setTimeout(() => {
      wx.navigateBack();
    }, 1500);
  },

  // 退出登录（改进：仅清除本地缓存，保留 openid 关联以便重新登录）
  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？\n\n退出后，下次使用微信登录仍可恢复您的账号数据',
      success: (res) => {
        if (res.confirm) {
          const info = getUserInfo();
          const savedOpenid = info.openid || '';

          logout();

          // 如果有 openid，保留它以便下次登录时恢复
          if (savedOpenid) {
            wx.setStorageSync('savedOpenid', savedOpenid);
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

  // 重新登录（保留 openid 的情况下快速登录）
  onRelogin() {
    const savedOpenid = wx.getStorageSync('savedOpenid');
    if (savedOpenid) {
      // 有保存的 openid，先尝试恢复云端数据
      this.getOpenIdAndLoginWithOpenid(savedOpenid);
    } else {
      // 没有保存的 openid，执行完整登录流程
      this.setData({ showNicknameInput: true, tempNickname: '' });
    }
  },

  // 使用已有 openid 快速登录
  async getOpenIdAndLoginWithOpenid(savedOpenid: string) {
    wx.showLoading({ title: '恢复账号中...', mask: true });

    try {
      // 先检查云端是否有该 openid 的数据
      const cloudData = await getUserDataFromCloud();

      // 1. 恢复旧版数据
      if (cloudData) {
        restoreLocalData(cloudData);
      }

      // 2. 恢复新版收藏夹数据
      const { pullCollectionsFromCloud } = require('../../../utils/cloudCollections');
      const pullResult = await pullCollectionsFromCloud();
      console.log('[Login] 收藏夹数据拉取结果:', pullResult);

      if (cloudData) {
        // 有云端数据，恢复并登录
        const nickname = cloudData.nickname || '美食家' + Math.floor(Math.random() * 9000 + 1000);
        const avatar = cloudData.avatar || '';
        const info = saveUserProfile(nickname, avatar, false, savedOpenid);

        wx.hideLoading();
        this.setData({
          userInfo: info,
          hasLogin: true,
          isGuest: false,
          nickname: info.nickname
        });
        wx.showToast({ title: '账号已恢复', icon: 'success' });

        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        // 云端无数据，但有 openid，使用默认信息登录
        const defaultNickname = '美食家' + Math.floor(Math.random() * 9000 + 1000);
        const info = saveUserProfile(defaultNickname, '', false, savedOpenid);

        wx.hideLoading();
        this.setData({
          userInfo: info,
          hasLogin: true,
          isGuest: false,
          nickname: info.nickname
        });
        wx.showToast({ title: '登录成功', icon: 'success' });

        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    } catch (e) {
      console.error('[Login] 恢复账号失败', e);
      wx.hideLoading();

      // 降级：使用保存的 openid 登录
      const defaultNickname = '美食家' + Math.floor(Math.random() * 9000 + 1000);
      const info = saveUserProfile(defaultNickname, '', false, savedOpenid);
      this.setData({
        userInfo: info,
        hasLogin: true,
        isGuest: false,
        nickname: info.nickname
      });
      wx.showToast({ title: '登录成功', icon: 'success' });

      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 查看用户协议
  onViewAgreement() {
    wx.showModal({
      title: '用户协议',
      content: 'AI智能菜谱用户服务协议\n\n一、服务说明\n\n"吃了么"AI智能菜谱是一款帮助用户发现食材做法、推荐菜谱的应用程序。\n\n二、使用规则\n\n1. 您同意并承诺按照本协议使用本服务\n2. 您承诺遵守当地法律法规\n\n三、免责声明\n\n1. 菜谱内容仅供参考\n2. 如有过敏史请在使用前咨询专业人士',
      showCancel: false,
      confirmText: '我知道了'
    });
  },

  // 查看隐私政策
  onViewPrivacy() {
    wx.showModal({
      title: '隐私政策',
      content: 'AI智能菜谱隐私政策\n\n一、信息收集\n\n1. 头像和昵称：您主动选择上传的内容\n2. 收藏记录：您主动收藏的菜谱数据\n\n二、信息使用\n\n您的信息将用于提供个性化服务和保存您的偏好设置。\n\n三、信息存储\n\n您的信息关联到您的微信账号，可在云端安全存储。',
      showCancel: false,
      confirmText: '我知道了'
    });
  }
});
