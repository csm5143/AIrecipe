<template>
  <div class="main-layout">
    <Sidebar />
    <div class="main-content">
      <Header />
      <main class="page-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import Sidebar from './Sidebar.vue';
import Header from './Header.vue';
</script>

<style scoped lang="scss">
.main-layout {
  display: flex;
  width: 100%;
  height: 100vh;
  background: var(--cursor-cream);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.page-content {
  flex: 1;
  overflow-y: auto;
  background: var(--cursor-cream);
}

/* Page transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
