<template>
  <header class="site-header">
    <div class="header-content">
      <!-- Logo -->
      <router-link to="/" class="logo">
        <img src="@/assets/logo.svg" alt="AIrecipe" class="logo-img" />
        <span class="logo-text">AIrecipe</span>
      </router-link>

      <!-- 导航链接 -->
      <nav class="nav-links">
        <router-link to="/" class="nav-link">首页</router-link>
        <router-link to="/download" class="nav-link">下载</router-link>
      </nav>

      <!-- CTA 按钮 -->
      <div class="header-cta">
        <router-link to="/download" class="btn btn-primary">
          立即体验
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </router-link>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
</script>

<style scoped lang="scss">
.site-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--header-height);
  background: rgba(242, 241, 237, 0.9);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-primary);
  z-index: 1000;
}

.header-content {
  max-width: var(--max-width);
  height: 100%;
  margin: 0 auto;
  padding: 0 var(--space-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  text-decoration: none;

  &:hover {
    color: inherit;
  }
}

.logo-img {
  width: 32px;
  height: 32px;
}

.logo-text {
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--cursor-dark);
  letter-spacing: -0.5px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.nav-link {
  font-size: var(--text-sm);
  font-weight: 500;
  color: rgba(38, 37, 30, 0.7);
  transition: color var(--transition-fast);

  &:hover,
  &.router-link-active {
    color: var(--cursor-dark);
  }
}

.header-cta {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

@media (max-width: 768px) {
  .header-content {
    padding: 0 var(--space-4);
  }

  .nav-links {
    display: none;
  }

  .logo-text {
    font-size: var(--text-lg);
  }
}
</style>
