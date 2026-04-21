<template>
  <view class="app">
    <slot />
  </view>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import './styles/index.scss';

onMounted(() => {
  console.log('AIRecipe Mobile App mounted');
});
</script>

<style lang="scss">
.app {
  width: 100%;
  min-height: 100vh;
  background: #f5f5f5;
}
</style>
