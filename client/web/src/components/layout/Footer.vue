<template>
  <footer class="site-footer">
    <div class="footer-content">
      <div class="footer-main">
        <div class="footer-brand">
          <div class="brand-logo">
            <img src="@/assets/logo.svg" alt="AIrecipe" />
            <span>AIrecipe</span>
          </div>
          <p class="brand-slogan">用 AI 做菜，每天都是大厨</p>
        </div>

        <div class="footer-links">
          <div class="link-group">
            <h4>产品</h4>
            <router-link to="/download">下载APP</router-link>
            <router-link to="/download#miniprogram">微信小程序</router-link>
          </div>
          <div class="link-group">
            <h4>支持</h4>
            <a href="mailto:contact@airecipe.com">联系我们</a>
          </div>
          <div class="link-group">
            <h4>法律</h4>
            <router-link to="/privacy">隐私政策</router-link>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <p class="copyright">© 2024 AIrecipe. All rights reserved.</p>
        <div class="social-links">
          <a href="#" class="social-link" title="微信公众号">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.5 11.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM12 6c-1.93 0-3.5 1.57-3.5 3.5s1.57 3.5 3.5 3.5 3.5-1.57 3.5-3.5-1.57-3.5-3.5-3.5zm5.5 5.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM12 2C6.48 2 2 6.48 2 12c0 2.17.69 4.18 1.86 5.81L2 22l4.19-1.86C7.82 21.31 9.83 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
</script>

<style scoped lang="scss">
.site-footer {
  background: var(--surface-400);
  border-top: 1px solid var(--border-primary);
  padding: var(--space-16) 0 var(--space-8);
}

.footer-content {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 var(--space-6);
}

.footer-main {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: var(--space-16);
  padding-bottom: var(--space-12);
  border-bottom: 1px solid var(--border-primary);
}

.footer-brand {
  .brand-logo {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-4);

    img {
      width: 28px;
      height: 28px;
    }

    span {
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--cursor-dark);
    }
  }

  .brand-slogan {
    font-size: var(--text-sm);
    color: rgba(38, 37, 30, 0.55);
  }
}

.footer-links {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-8);
}

.link-group {
  h4 {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--cursor-dark);
    margin-bottom: var(--space-4);
  }

  a {
    display: block;
    font-size: var(--text-sm);
    color: rgba(38, 37, 30, 0.55);
    margin-bottom: var(--space-2);
    transition: color var(--transition-fast);

    &:hover {
      color: var(--cursor-orange);
    }
  }
}

.footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--space-8);
}

.copyright {
  font-size: var(--text-xs);
  color: rgba(38, 37, 30, 0.4);
}

.social-links {
  display: flex;
  gap: var(--space-4);
}

.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  color: rgba(38, 37, 30, 0.5);
  transition: all var(--transition-fast);

  &:hover {
    background: var(--surface-300);
    color: var(--cursor-dark);
  }
}

@media (max-width: 768px) {
  .footer-main {
    grid-template-columns: 1fr;
    gap: var(--space-10);
  }

  .footer-links {
    grid-template-columns: repeat(2, 1fr);
  }

  .footer-bottom {
    flex-direction: column;
    gap: var(--space-4);
    text-align: center;
  }
}
</style>
