<template>
  <footer class="site-footer">
    <div class="container">
      <div class="footer-panel reveal">
        <!-- Brand column -->
        <div class="footer-brand">
          <router-link to="/" class="footer-brand-lockup">
            <img src="@/assets/logo.svg" alt="AIrecipe logo" class="footer-logo" />
            <span class="footer-brand-name">AIrecipe</span>
          </router-link>

          <p class="footer-slogan display-font">
            让冰箱里的食材，<br />先变成灵感，再变成一顿好饭。
          </p>

          <p class="footer-copy">
            智能菜谱生成系统。拍照识别食材，AI 实时生成菜谱，营养数据同步追踪。
          </p>

          <!-- Social links -->
          <div class="social-links">
            <a href="#" class="social-btn" aria-label="微信">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </a>
            <a href="#" class="social-btn" aria-label="微博">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12h8M12 8v8" />
              </svg>
            </a>
            <a href="#" class="social-btn" aria-label="邮箱">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </a>
          </div>
        </div>

        <!-- Link columns -->
        <div class="footer-links">
          <div class="link-col">
            <h3 class="link-heading">产品</h3>
            <a href="#features" class="link-item" @click.prevent="scrollTo('features')">核心功能</a>
            <a href="#workflow" class="link-item" @click.prevent="scrollTo('workflow')">使用流程</a>
            <a href="#download" class="link-item" @click.prevent="scrollTo('download')">下载入口</a>
          </div>

          <div class="link-col">
            <h3 class="link-heading">支持</h3>
            <a href="mailto:contact@airecipe.com" class="link-item">联系我们</a>
            <a href="#faq" class="link-item" @click.prevent="scrollTo('faq')">常见问题</a>
          </div>

          <div class="link-col">
            <h3 class="link-heading">法律</h3>
            <a href="#" class="link-item">隐私政策</a>
            <a href="#" class="link-item">服务条款</a>
          </div>
        </div>
      </div>

      <!-- Bottom bar -->
      <div class="footer-bottom reveal">
        <span class="copyright">
          <span class="brand-mark-small">AIrecipe</span>
          &copy; {{ currentYear }} — 让做饭更有灵感。
        </span>
        <span class="built-with">Built with care</span>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const currentYear = new Date().getFullYear()

function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<style scoped lang="scss">
.site-footer {
  padding: 72px 0 32px;
}

.footer-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: clamp(32px, 7vw, 88px);
  padding: clamp(32px, 5vw, 52px);
  background: var(--surface);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    border-radius: inherit;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 55%);
  }
}

.footer-brand {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.footer-brand-lockup {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  width: fit-content;
  transition: opacity var(--duration-fast) var(--ease-spring);

  &:hover { opacity: 0.8; }
}

.footer-logo {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
}

.footer-brand-name {
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--text-primary);
}

.footer-slogan {
  font-size: clamp(1.5rem, 3vw, 2.6rem);
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.03em;
  color: var(--text-primary);
}

.footer-copy {
  font-size: 0.88rem;
  font-weight: 500;
  color: var(--text-secondary);
  line-height: 1.75;
  max-width: 360px;
}

.social-links {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.social-btn {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  background: rgba(27, 38, 31, 0.05);
  border: 1px solid var(--border-soft);
  display: grid;
  place-items: center;
  color: var(--text-secondary);
  transition:
    background var(--duration-fast) var(--ease-spring),
    color var(--duration-fast) var(--ease-spring),
    transform var(--duration-fast) var(--ease-spring);

  &:hover {
    background: rgba(27, 38, 31, 0.1);
    color: var(--text-primary);
    transform: translateY(-2px);
  }

  &:active { transform: scale(0.95); }
}

.footer-links {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  align-content: start;
}

.link-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.link-heading {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.link-item {
  font-size: 0.88rem;
  font-weight: 500;
  color: var(--text-secondary);
  transition: color var(--duration-fast) var(--ease-spring);

  &:hover {
    color: var(--accent);
  }
}

.footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 28px;
  padding-top: 24px;
  border-top: 1px solid var(--border-soft);
}

.copyright {
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--text-muted);
}

.brand-mark-small {
  font-weight: 700;
}

.built-with {
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--text-muted);
  font-style: italic;
}

// Responsive
@media (max-width: 860px) {
  .footer-panel {
    grid-template-columns: 1fr;
    gap: 40px;
  }

  .footer-links {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 560px) {
  .footer-links {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  .footer-bottom {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }
}
</style>
