<template>
  <view class="login-page">
    <!-- 背景 -->
    <view class="login-bg">
      <image class="bg-pattern" src="/static/images/login-bg.png" mode="aspectFill" />
    </view>

    <!-- Logo 区域 -->
    <view class="logo-section">
      <image class="logo" src="/static/images/logo.png" mode="aspectFit" />
      <text class="app-name">吃了么</text>
      <text class="app-slogan">AI智能菜谱，美食触手可及</text>
    </view>

    <!-- 登录表单 -->
    <view class="login-form">
      <!-- 手机号输入 -->
      <view class="form-item">
        <view class="form-label">手机号</view>
        <input
          v-model="phone"
          class="form-input"
          type="number"
          maxlength="11"
          placeholder="请输入手机号"
        />
      </view>

      <!-- 验证码输入 -->
      <view class="form-item">
        <view class="form-label">验证码</view>
        <view class="code-input-wrap">
          <input
            v-model="code"
            class="form-input"
            type="number"
            maxlength="6"
            placeholder="请输入验证码"
          />
          <view class="code-btn" :class="{ 'code-btn--disabled': counting }" @tap="sendCode">
            <text v-if="!counting">获取验证码</text>
            <text v-else>{{ countDown }}s</text>
          </view>
        </view>
      </view>

      <!-- 登录按钮 -->
      <view class="login-btn" :class="{ 'login-btn--disabled': !canLogin }" @tap="handleLogin">
        <text>登录</text>
      </view>

      <!-- 其他登录方式 -->
      <view class="other-login">
        <view class="divider">
          <view class="divider-line"></view>
          <text class="divider-text">其他登录方式</text>
          <view class="divider-line"></view>
        </view>
        <view class="login-icons">
          <view class="login-icon" @tap="wechatLogin">
            <image src="/static/icons/wechat.png" mode="aspectFit" />
            <text>微信</text>
          </view>
          <view class="login-icon" @tap="appleLogin">
            <image src="/static/icons/apple.png" mode="aspectFit" />
            <text>Apple</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 用户协议 -->
    <view class="agreement">
      <view class="checkbox" :class="{ 'checkbox--checked': agreed }" @tap="toggleAgreement"></view>
      <text class="agreement-text">
        登录即表示同意
        <text class="link" @tap.stop="goToUserAgreement">《用户协议》</text>
        和
        <text class="link" @tap.stop="goToPrivacyPolicy">《隐私政策》</text>
      </text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useUserStore } from '@/store/user';
import { sendVerifyCode } from '@/api/auth';
import { reLaunch } from '@/utils/navigate';
import { showToast } from '@/utils/toast';

const userStore = useUserStore();

const phone = ref('');
const code = ref('');
const agreed = ref(false);
const counting = ref(false);
const countDown = ref(60);

const canLogin = computed(() => {
  return phone.value.length === 11 && code.value.length === 6 && agreed.value;
});

function toggleAgreement() {
  agreed.value = !agreed.value;
}

async function sendCode() {
  if (counting.value) return;
  if (phone.value.length !== 11) {
    showToast('请输入正确的手机号');
    return;
  }

  try {
    await sendVerifyCode(phone.value);
    showToast('验证码已发送');
    startCountdown();
  } catch (e) {
    showToast('发送失败，请稍后重试');
  }
}

function startCountdown() {
  counting.value = true;
  countDown.value = 60;

  const timer = setInterval(() => {
    countDown.value--;
    if (countDown.value <= 0) {
      counting.value = false;
      clearInterval(timer);
    }
  }, 1000);
}

async function handleLogin() {
  if (!canLogin.value) return;

  try {
    const success = await userStore.login({
      phone: phone.value,
      code: code.value,
    });

    if (success) {
      showToast('登录成功');
      reLaunch('/pages/index/index');
    }
  } catch (e: any) {
    showToast(e.message || '登录失败');
  }
}

function wechatLogin() {
  // #ifdef APP-PLUS
  uni.login({
    provider: 'weixin',
    success: (res) => {
      console.log('Wechat login:', res);
      // TODO: 调用后端微信登录接口
    },
    fail: () => {
      showToast('微信登录失败');
    },
  });
  // #endif

  // #ifndef APP-PLUS
  showToast('仅支持 APP 端微信登录');
  // #endif
}

function appleLogin() {
  // #ifdef APP-PLUS
  uni.login({
    provider: 'apple',
    success: (res) => {
      console.log('Apple login:', res);
      // TODO: 调用后端 Apple 登录接口
    },
    fail: () => {
      showToast('Apple 登录失败');
    },
  });
  // #endif

  // #ifndef APP-PLUS
  showToast('仅支持 APP 端 Apple 登录');
  // #endif
}

function goToUserAgreement() {
  // TODO: 打开用户协议页面
}

function goToPrivacyPolicy() {
  // TODO: 打开隐私政策页面
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.login-page {
  min-height: 100vh;
  background-color: #fffaf5;
  position: relative;
}

.login-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 500rpx;
  overflow: hidden;

  .bg-pattern {
    width: 100%;
    height: 100%;
  }
}

.logo-section {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 120rpx;

  .logo {
    width: 160rpx;
    height: 160rpx;
    margin-bottom: $spacing-base;
  }

  .app-name {
    font-size: 48rpx;
    font-weight: bold;
    color: $text-color;
    margin-bottom: $spacing-xs;
  }

  .app-slogan {
    font-size: $font-size-base;
    color: $text-color-secondary;
  }
}

.login-form {
  position: relative;
  margin: 60rpx $spacing-xl 0;
  padding: $spacing-xl;
  background-color: $white;
  border-radius: $border-radius-xl;
  box-shadow: $shadow-lg;

  .form-item {
    margin-bottom: $spacing-base;

    .form-label {
      font-size: $font-size-sm;
      color: $text-color-secondary;
      margin-bottom: $spacing-xs;
    }

    .form-input {
      height: 88rpx;
      padding: 0 $spacing-base;
      background-color: $bg-color;
      border-radius: $border-radius-base;
      font-size: $font-size-base;
    }

    .code-input-wrap {
      display: flex;
      gap: $spacing-sm;

      .form-input {
        flex: 1;
      }

      .code-btn {
        width: 200rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: $primary-color;
        color: $white;
        border-radius: $border-radius-base;
        font-size: $font-size-sm;

        &--disabled {
          background-color: $text-color-disabled;
        }
      }
    }
  }

  .login-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 88rpx;
    margin-top: $spacing-lg;
    background-color: $primary-color;
    border-radius: $border-radius-base;

    text {
      color: $white;
      font-size: $font-size-lg;
      font-weight: bold;
    }

    &--disabled {
      background-color: $text-color-disabled;
    }
  }

  .other-login {
    margin-top: $spacing-xl;

    .divider {
      display: flex;
      align-items: center;
      margin-bottom: $spacing-base;

      .divider-line {
        flex: 1;
        height: 1rpx;
        background-color: $border-color;
      }

      .divider-text {
        padding: 0 $spacing-base;
        font-size: $font-size-sm;
        color: $text-color-secondary;
      }
    }

    .login-icons {
      display: flex;
      justify-content: center;
      gap: $spacing-xl;

      .login-icon {
        display: flex;
        flex-direction: column;
        align-items: center;

        image {
          width: 80rpx;
          height: 80rpx;
          margin-bottom: $spacing-xs;
        }

        text {
          font-size: $font-size-sm;
          color: $text-color-secondary;
        }
      }
    }
  }
}

.agreement {
  position: absolute;
  bottom: 60rpx;
  left: $spacing-base;
  right: $spacing-base;
  display: flex;
  align-items: flex-start;
  gap: $spacing-sm;

  .checkbox {
    width: 36rpx;
    height: 36rpx;
    border: 2rpx solid $text-color-secondary;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 4rpx;

    &--checked {
      background-color: $primary-color;
      border-color: $primary-color;
    }
  }

  .agreement-text {
    font-size: $font-size-sm;
    color: $text-color-secondary;
    line-height: 1.5;

    .link {
      color: $primary-color;
    }
  }
}
</style>
