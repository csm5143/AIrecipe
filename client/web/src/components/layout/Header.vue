<template>
  <header class="site-header" :class="{ scrolled: isScrolled, 'menu-open': mobileOpen }">
    <div class="header-shell">
      <!-- Brand -->
      <router-link to="/" class="brand" @click="mobileOpen = false">
        <img src="@/assets/logo.svg" alt="AIrecipe logo" class="brand-mark" />
        <span class="brand-name">AIrecipe</span>
      </router-link>

      <!-- Desktop Nav -->
      <nav class="desktop-nav" aria-label="主导航">
        <router-link to="/" class="nav-link" @click="mobileOpen = false">首页</router-link>
        <a href="#features" class="nav-link" @click.prevent="scrollTo('features')">功能</a>
        <a href="#workflow" class="nav-link" @click.prevent="scrollTo('workflow')">流程</a>
        <a href="#download" class="nav-link" @click.prevent="scrollTo('download')">下载</a>
      </nav>

      <!-- Actions -->
      <div class="header-actions">
        <ThemeToggle />

        <LiquidGlass
          class-name="cta-liquid"
          padding="0"
          :corner-radius="20"
          :displacement-scale="30"
          :blur-amount="0.05"
          :saturation="130"
          :aberration-intensity="0.8"
          :elasticity="0.14"
          :mode="GlassMode.prominent"
          @click="scrollTo('download')"
        >
          <button class="btn-primary-liquid">
            立即体验
            <span class="btn-icon-wrap">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </span>
          </button>
        </LiquidGlass>

        <!-- Mobile Hamburger -->
        <button
          class="hamburger"
          :class="{ active: mobileOpen }"
          :aria-expanded="mobileOpen"
          aria-label="打开导航菜单"
          @click="mobileOpen = !mobileOpen"
        >
          <span class="bar bar-1"></span>
          <span class="bar bar-2"></span>
          <span class="bar bar-3"></span>
        </button>
      </div>
    </div>

    <!-- Mobile Menu Overlay -->
    <Transition name="mobile-overlay">
      <div v-if="mobileOpen" class="mobile-overlay">
        <nav class="mobile-nav" aria-label="移动端导航">
          <a
            v-for="(item, i) in navItems"
            :key="item.label"
            :href="item.href"
            class="mobile-nav-item"
            :style="`--i: ${i}`"
            @click="handleMobileNav(item.href)"
          >
            <span class="mobile-nav-num">0{{ i + 1 }}</span>
            <span class="mobile-nav-label">{{ item.label }}</span>
            <svg class="mobile-nav-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </nav>

        <div class="mobile-overlay-footer">
          <button class="btn btn-primary" @click="handleMobileNav('#download')">
            立即体验
          </button>
        </div>
      </div>
    </Transition>
  </header>
</template>

<script setup lang="ts">
import { GlassMode, LiquidGlass } from '@wxperia/liquid-glass-vue'
import { onMounted, onUnmounted, ref } from 'vue'
import ThemeToggle from '@/components/ThemeToggle.vue'

const isScrolled = ref(false)
const mobileOpen = ref(false)

const navItems = [
  { label: '首页', href: '/' },
  { label: '功能', href: '#features' },
  { label: '流程', href: '#workflow' },
  { label: '下载', href: '#download' },
]

function onScroll() {
  isScrolled.value = window.scrollY > 12
}

function scrollTo(id: string) {
  if (id === '/') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  const el = document.getElementById(id.replace('#', ''))
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function handleMobileNav(href: string) {
  mobileOpen.value = false
  requestAnimationFrame(() => scrollTo(href))
}

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<style scoped lang="scss">
.site-header {
  position: fixed;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  z-index: var(--z-sticky);
  width: min(100%, calc(var(--max-width) + 32px));
  padding: 0 var(--content-padding);
  pointer-events: none;
}

.header-shell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 64px;
  padding: 8px 10px 8px 14px;
  border-radius: var(--radius-2xl);
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(24px) saturate(200%);
  -webkit-backdrop-filter: blur(24px) saturate(200%);
  box-shadow: var(--shadow-md);
  pointer-events: auto;
  transition:
    background var(--duration-base) var(--ease-spring),
    border-color var(--duration-base) var(--ease-spring),
    box-shadow var(--duration-base) var(--ease-spring),
    padding var(--duration-base) var(--ease-spring);
}

.scrolled .header-shell {
  background: rgba(255, 255, 255, 0.88);
  border-color: rgba(255, 255, 255, 0.92);
  box-shadow: var(--shadow-lg);
  padding: 6px 10px 6px 14px;
  height: 60px;
}

// Brand
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  transition: opacity var(--duration-fast) var(--ease-spring);

  &:hover { opacity: 0.82; }
}

.brand-mark {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-sm);
}

.brand-name {
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--text-primary);
}

// Desktop Nav
.desktop-nav {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.48);
  border: 1px solid rgba(255, 255, 255, 0.56);
}

.nav-link {
  padding: 8px 16px;
  border-radius: var(--radius-full);
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-secondary);
  transition:
    color var(--duration-fast) var(--ease-spring),
    background var(--duration-fast) var(--ease-spring);

  &:hover,
  &.router-link-active {
    color: var(--text-primary);
    background: rgba(255, 245, 233, 0.88);
  }
}

// Header Actions
.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.cta-liquid {
  display: inline-flex;
}

.btn-primary-liquid {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 46px;
  padding: 0 18px;
  border-radius: var(--radius-full);
  font-size: 0.9rem;
  font-weight: 700;
  color: #fff9ee;
  background: linear-gradient(135deg, #1b261f, #2d3c33);
  box-shadow: var(--shadow-sm);
  transition:
    transform var(--duration-fast) var(--ease-spring),
    box-shadow var(--duration-base) var(--ease-spring);

  &:active {
    transform: scale(0.97);
  }

  &:hover {
    box-shadow: var(--shadow-md);
  }
}

// Hamburger
.hamburger {
  display: none;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 42px;
  height: 42px;
  gap: 5px;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: var(--shadow-xs);
  cursor: pointer;
  transition:
    background var(--duration-fast) var(--ease-spring),
    transform var(--duration-fast) var(--ease-spring);
}

.bar {
  display: block;
  width: 18px;
  height: 2px;
  border-radius: 999px;
  background: var(--text-primary);
  transition:
    transform var(--duration-base) var(--ease-spring),
    opacity var(--duration-fast) var(--ease-spring);
  transform-origin: center;
}

.hamburger.active .bar-1 {
  transform: translateY(7px) rotate(45deg);
}

.hamburger.active .bar-2 {
  opacity: 0;
  transform: scaleX(0);
}

.hamburger.active .bar-3 {
  transform: translateY(-7px) rotate(-45deg);
}

// Mobile Overlay
.mobile-overlay {
  position: fixed;
  inset: 0;
  z-index: calc(var(--z-sticky) - 1);
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 100px var(--content-padding) 40px;
  background: rgba(255, 249, 238, 0.96);
  backdrop-filter: blur(32px) saturate(200%);
  -webkit-backdrop-filter: blur(32px) saturate(200%);
  pointer-events: auto;
}

.mobile-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mobile-nav-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px 24px;
  border-radius: var(--radius-lg);
  transition:
    background var(--duration-fast) var(--ease-spring),
    transform var(--duration-fast) var(--ease-spring);
  transform: translateY(0);

  &:hover {
    background: rgba(27, 38, 31, 0.05);
    transform: translateX(6px);
  }
}

.mobile-nav-num {
  font-size: 0.75rem;
  font-weight: 700;
  font-family: var(--font-mono);
  color: var(--accent);
  letter-spacing: 0.05em;
  flex-shrink: 0;
}

.mobile-nav-label {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  flex: 1;
}

.mobile-nav-arrow {
  color: var(--text-muted);
  flex-shrink: 0;
  transition: transform var(--duration-fast) var(--ease-spring);

  .mobile-nav-item:hover & {
    transform: translateX(4px);
    color: var(--accent);
  }
}

.mobile-overlay-footer {
  margin-top: 40px;
  padding-top: 32px;
  border-top: 1px solid var(--border-soft);
}

// Mobile Overlay Transitions
.mobile-overlay-enter-active {
  transition: opacity var(--duration-slow) var(--ease-spring), transform var(--duration-slow) var(--ease-spring);
}

.mobile-overlay-leave-active {
  transition: opacity var(--duration-base) var(--ease-spring), transform var(--duration-base) var(--ease-spring);
}

.mobile-overlay-enter-from,
.mobile-overlay-leave-to {
  opacity: 0;
  transform: translateY(-16px) scale(0.98);
}

// Responsive
@media (max-width: 900px) {
  .desktop-nav {
    display: none;
  }

  .cta-liquid {
    display: none;
  }

  .hamburger {
    display: flex;
  }
}
</style>
