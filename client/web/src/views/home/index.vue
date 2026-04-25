<template>
  <MainLayout>
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">用 AI 做菜<br />每天都是大厨</h1>
        <p class="hero-subtitle">
          拍照识别食材，AI 生成专属菜谱，科学管理营养摄入<br />
          让每一餐都充满智慧与美味
        </p>
        <div class="hero-actions">
          <router-link to="/download#miniprogram" class="btn btn-primary btn-lg">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.5 11.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM12 6c-1.93 0-3.5 1.57-3.5 3.5s1.57 3.5 3.5 3.5 3.5-1.57 3.5-3.5-1.57-3.5-3.5-3.5zm5.5 5.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM12 2C6.48 2 2 6.48 2 12c0 2.17.69 4.18 1.86 5.81L2 22l4.19-1.86C7.82 21.31 9.83 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"/>
            </svg>
            微信小程序
          </router-link>
          <router-link to="/download#app" class="btn btn-orange btn-lg">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
            下载 APP
          </router-link>
        </div>
      </div>
      <div class="hero-visual">
        <div class="phone-mockup">
          <div class="phone-frame">
            <div class="phone-screen">
              <img src="@/assets/hero-app.svg" alt="APP界面预览" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Product Showcase -->
    <section class="showcase section">
      <div class="container">
        <h2 class="section-title text-center">双端体验，随心选择</h2>
        <p class="section-subtitle text-center">微信小程序无需下载，APP 功能更完整</p>

        <div class="showcase-grid">
          <div class="showcase-card" id="miniprogram">
            <div class="card-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.5 11.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM12 6c-1.93 0-3.5 1.57-3.5 3.5s1.57 3.5 3.5 3.5 3.5-1.57 3.5-3.5-1.57-3.5-3.5-3.5zm5.5 5.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM12 2C6.48 2 2 6.48 2 12c0 2.17.69 4.18 1.86 5.81L2 22l4.19-1.86C7.82 21.31 9.83 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"/>
              </svg>
            </div>
            <h3>微信小程序</h3>
            <p class="card-desc">微信扫一扫，立即体验</p>
            <ul class="card-features">
              <li>无需下载安装</li>
              <li>微信内直接使用</li>
              <li>分享方便快捷</li>
            </ul>
            <div class="card-qr">
              <img src="@/assets/qr-miniprogram.svg" alt="小程序码" />
              <p>扫码体验</p>
            </div>
          </div>

          <div class="showcase-card" id="app">
            <div class="card-icon app-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                <path d="M12 18h.01"/>
              </svg>
            </div>
            <h3>独立 APP</h3>
            <p class="card-desc">功能完整，体验更流畅</p>
            <ul class="card-features">
              <li>离线可用</li>
              <li>推送通知提醒</li>
              <li>更快的响应速度</li>
            </ul>
            <div class="app-download-buttons">
              <a href="#" class="download-btn app-store">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div>
                  <span class="btn-label">下载</span>
                  <span class="btn-name">App Store</span>
                </div>
              </a>
              <a href="#" class="download-btn android">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24c-2.86-1.21-6.08-1.21-8.94 0L5.65 5.67c-.19-.29-.51-.38-.83-.22-.31.16-.43.54-.26.85L6.4 9.48C3.3 11.25 1.28 14.44 1 18h22c-.28-3.56-2.3-6.75-5.4-8.52z"/>
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2z"/>
                </svg>
                <div>
                  <span class="btn-label">下载</span>
                  <span class="btn-name">Android APK</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="features section">
      <div class="container">
        <h2 class="section-title text-center">核心功能</h2>
        <p class="section-subtitle text-center">每一项功能，都为你的餐桌而生</p>

        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
            <h3>拍照识材</h3>
            <p>打开相机，对准食材拍照，AI 自动识别并告诉你有哪些食材可以做菜</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 2a5 5 0 0 1 5 5v5a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5z"/>
                <path d="M8.5 17a4.5 4.5 0 0 0 7 0"/>
                <path d="M3 22h18"/>
              </svg>
            </div>
            <h3>AI 菜谱</h3>
            <p>选择你想要的食材，AI 为你生成专属菜谱，步骤详细，新手也能做出美味</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M18 20V10"/>
                <path d="M12 20V4"/>
                <path d="M6 20v-6"/>
              </svg>
            </div>
            <h3>营养追踪</h3>
            <p>记录每日饮食，自动计算营养摄入，健身减脂、孕期营养都能科学管理</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <h3>收藏分享</h3>
            <p>喜欢的菜谱一键收藏，还能分享给好友，一起享受烹饪的乐趣</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section class="stats section">
      <div class="container">
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-number">10,000+</div>
            <div class="stat-label">精品菜谱</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">50,000+</div>
            <div class="stat-label">注册用户</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">4.8</div>
            <div class="stat-label">用户评分</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">500,000+</div>
            <div class="stat-label">日使用次数</div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta section">
      <div class="container">
        <div class="cta-content">
          <h2>准备好开始你的智能烹饪之旅了吗？</h2>
          <p>立即体验 AIrecipe，让每一餐都充满惊喜</p>
          <div class="cta-buttons">
            <router-link to="/download#miniprogram" class="btn btn-primary btn-lg">
              微信小程序
            </router-link>
            <router-link to="/download#app" class="btn btn-orange btn-lg">
              下载 APP
            </router-link>
          </div>
        </div>
      </div>
    </section>
  </MainLayout>
</template>

<script setup lang="ts">
import MainLayout from '@/components/layout/MainLayout.vue'
</script>

<style scoped lang="scss">
.hero {
  min-height: calc(100vh - var(--header-height));
  display: flex;
  align-items: center;
  padding: var(--space-16) var(--space-6);
  max-width: var(--max-width);
  margin: 0 auto;
  gap: var(--space-16);
}

.hero-content {
  flex: 1;
}

.hero-title {
  font-size: var(--text-hero);
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -2px;
  margin-bottom: var(--space-6);
  color: var(--cursor-dark);
}

.hero-subtitle {
  font-size: var(--text-lg);
  color: rgba(38, 37, 30, 0.6);
  line-height: 1.8;
  margin-bottom: var(--space-10);
}

.hero-actions {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.hero-visual {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.phone-mockup {
  position: relative;
}

.phone-frame {
  width: 280px;
  height: 560px;
  background: var(--cursor-dark);
  border-radius: 40px;
  padding: 12px;
  box-shadow: var(--shadow-xl);
}

.phone-screen {
  width: 100%;
  height: 100%;
  background: var(--surface-200);
  border-radius: 32px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.showcase {
  background: var(--surface-300);
}

.showcase-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-8);
}

.showcase-card {
  background: var(--surface-200);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl);
  padding: var(--space-10);
  text-align: center;

  .card-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto var(--space-6);
    background: rgba(245, 78, 0, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--cursor-orange);
  }

  h3 {
    font-size: var(--text-2xl);
    margin-bottom: var(--space-2);
  }

  .card-desc {
    color: rgba(38, 37, 30, 0.55);
    margin-bottom: var(--space-6);
  }

  .card-features {
    text-align: left;
    margin-bottom: var(--space-8);

    li {
      padding: var(--space-2) 0;
      padding-left: var(--space-6);
      position: relative;
      color: rgba(38, 37, 30, 0.7);

      &::before {
        content: '✓';
        position: absolute;
        left: 0;
        color: var(--color-success);
      }
    }
  }

  .card-qr {
    img {
      width: 160px;
      height: 160px;
      margin: 0 auto var(--space-3);
      background: white;
      padding: var(--space-3);
      border-radius: var(--radius-md);
    }

    p {
      font-size: var(--text-sm);
      color: rgba(38, 37, 30, 0.55);
    }
  }

  .app-download-buttons {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .download-btn {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-4);
    background: var(--cursor-dark);
    color: white;
    border-radius: var(--radius-md);
    transition: all var(--transition-fast);

    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
      color: white;
    }

    .btn-label {
      display: block;
      font-size: var(--text-xs);
      opacity: 0.7;
    }

    .btn-name {
      display: block;
      font-size: var(--text-sm);
      font-weight: 500;
    }
  }
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-6);
}

.feature-card {
  text-align: center;
  padding: var(--space-8);
  background: var(--surface-300);
  border-radius: var(--radius-lg);
  transition: all var(--transition-normal);

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
  }

  .feature-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto var(--space-5);
    background: var(--surface-400);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--cursor-orange);
  }

  h3 {
    font-size: var(--text-lg);
    margin-bottom: var(--space-3);
  }

  p {
    font-size: var(--text-sm);
    color: rgba(38, 37, 30, 0.55);
    line-height: 1.7;
  }
}

.stats {
  background: var(--cursor-dark);
  color: white;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-8);
  text-align: center;
}

.stat-item {
  .stat-number {
    font-size: var(--text-4xl);
    font-weight: 600;
    margin-bottom: var(--space-2);
  }

  .stat-label {
    font-size: var(--text-sm);
    opacity: 0.7;
  }
}

.cta {
  background: linear-gradient(135deg, var(--surface-300) 0%, var(--surface-400) 100%);
}

.cta-content {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;

  h2 {
    font-size: var(--text-3xl);
    margin-bottom: var(--space-4);
  }

  p {
    font-size: var(--text-lg);
    color: rgba(38, 37, 30, 0.6);
    margin-bottom: var(--space-8);
  }
}

.cta-buttons {
  display: flex;
  justify-content: center;
  gap: var(--space-4);
}

@media (max-width: 1024px) {
  .hero {
    flex-direction: column;
    text-align: center;
    padding-top: var(--space-8);
  }

  .hero-actions {
    justify-content: center;
  }

  .hero-visual {
    margin-top: var(--space-8);
  }

  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-6);
  }
}

@media (max-width: 768px) {
  .showcase-grid {
    grid-template-columns: 1fr;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .cta-buttons {
    flex-direction: column;
    align-items: center;
  }
}
</style>
