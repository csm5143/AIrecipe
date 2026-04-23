<template>
  <view class="empty-state">
    <image class="empty-image" :src="image || '/static/images/empty.png'" mode="aspectFit" />
    <view class="empty-text">{{ text || '暂无数据' }}</view>
    <view v-if="showButton" class="empty-button" @tap="handleAction">
      <text>{{ buttonText }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
interface Props {
  image?: string;
  text?: string;
  buttonText?: string;
  showButton?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  text: '暂无数据',
  buttonText: '返回首页',
  showButton: false,
});

const emit = defineEmits<{
  action: [];
}>();

function handleAction() {
  emit('action');
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-xl 0;

  .empty-image {
    width: 300rpx;
    height: 300rpx;
    margin-bottom: $spacing-base;
  }

  .empty-text {
    font-size: $font-size-base;
    color: $text-color-secondary;
    margin-bottom: $spacing-lg;
  }

  .empty-button {
    background-color: $primary-color;
    color: $white;
    font-size: $font-size-base;
    padding: $spacing-sm $spacing-xl;
    border-radius: $border-radius-base;
  }
}
</style>
