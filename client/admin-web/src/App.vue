<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

onMounted(() => {
  console.log('AIRecipe Admin Web 已启动');
});
</script>

<style>
#app {
  width: 100%;
  height: 100%;
}
</style>
