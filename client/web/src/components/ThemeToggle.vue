<template>
  <button
    class="theme-toggle"
    :aria-label="isDark ? '切换到浅色模式' : '切换到深色模式'"
    @click="toggleTheme"
  >
    <span class="track" :class="{ dark: isDark }">
      <span class="thumb">
        <!-- Moon icon (dark mode active) -->
        <svg v-if="isDark" class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
        <!-- Sun icon (light mode active) -->
        <svg v-else class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      </span>
    </span>
  </button>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

const isDark = ref(false)

onMounted(() => {
  isDark.value = document.documentElement.getAttribute('data-theme') === 'dark'
})

function toggleTheme() {
  isDark.value = !isDark.value
  const theme = isDark.value ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('airecipe-theme', theme)
}
</script>

<style scoped lang="scss">
.theme-toggle {
  display: inline-flex;
  align-items: center;
  padding: 0;
  border-radius: var(--radius-full);
  background: transparent;
  cursor: pointer;
  transition: transform var(--duration-fast) var(--ease-spring);

  &:hover {
    transform: scale(1.08);
  }

  &:active {
    transform: scale(0.93);
  }
}

.track {
  position: relative;
  width: 52px;
  height: 34px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.64);
  border: 1px solid rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: var(--shadow-xs);
  transition:
    background var(--duration-base) var(--ease-spring),
    border-color var(--duration-base) var(--ease-spring),
    box-shadow var(--duration-base) var(--ease-spring);
}

.track.dark {
  background: rgba(27, 38, 31, 0.72);
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: var(--shadow-sm);
}

.thumb {
  position: absolute;
  top: 4px;
  left: 4px;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff9ee;
  box-shadow: 0 4px 12px rgba(27, 38, 31, 0.2);
  transition:
    transform var(--duration-slow) var(--ease-spring),
    background var(--duration-base) var(--ease-spring),
    box-shadow var(--duration-base) var(--ease-spring);
}

.track.dark .thumb {
  transform: translateX(18px);
  background: var(--accent);
  box-shadow: 0 4px 14px rgba(255, 122, 89, 0.4);
}

.icon {
  color: var(--text-primary);
  transition: color var(--duration-base) var(--ease-spring);

  .track.dark & {
    color: #fff9ee;
  }
}
</style>
