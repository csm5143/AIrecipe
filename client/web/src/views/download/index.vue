<template>
  <MainLayout>
    <section class="download-page">
      <div class="container">
        <h1 class="page-title">选择你的体验方式</h1>
        <p class="page-subtitle">微信小程序无需下载，APP 功能更完整</p>

        <!-- Download Options -->
        <div class="download-options">
          <!-- 小程序 -->
          <div class="download-card" id="miniprogram">
            <div class="card-header">
              <div class="card-icon miniprogram">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.5 11.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM12 6c-1.93 0-3.5 1.57-3.5 3.5s1.57 3.5 3.5 3.5 3.5-1.57 3.5-3.5-1.57-3.5-3.5-3.5zm5.5 5.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM12 2C6.48 2 2 6.48 2 12c0 2.17.69 4.18 1.86 5.81L2 22l4.19-1.86C7.82 21.31 9.83 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"/>
                </svg>
              </div>
              <div class="card-title">
                <h2>微信小程序</h2>
                <p>扫码即用，无需下载</p>
              </div>
            </div>

            <div class="card-body">
              <div class="qr-section">
                <div class="qr-code">
                  <img src="@/assets/qr-miniprogram.svg" alt="小程序码" />
                </div>
                <p class="qr-hint">微信扫一扫，立即体验</p>
              </div>

              <div class="steps">
                <div class="step">
                  <span class="step-num">1</span>
                  <span>打开微信</span>
                </div>
                <div class="step-arrow">→</div>
                <div class="step">
                  <span class="step-num">2</span>
                  <span>扫一扫</span>
                </div>
                <div class="step-arrow">→</div>
                <div class="step">
                  <span class="step-num">3</span>
                  <span>开始体验</span>
                </div>
              </div>
            </div>

            <div class="card-footer">
              <div class="features-list">
                <span class="feature-tag">无需下载</span>
                <span class="feature-tag">微信内使用</span>
                <span class="feature-tag">分享方便</span>
              </div>
            </div>
          </div>

          <!-- APP -->
          <div class="download-card app-card" id="app">
            <div class="card-header">
              <div class="card-icon app">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                  <path d="M12 18h.01"/>
                </svg>
              </div>
              <div class="card-title">
                <h2>独立 APP</h2>
                <p>功能完整，体验更流畅</p>
              </div>
            </div>

            <div class="card-body">
              <div class="platform-buttons">
                <a href="#" class="platform-btn ios">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <div class="btn-text">
                    <span class="btn-label">在 App Store 下载</span>
                    <span class="btn-name">iOS 版本</span>
                  </div>
                  <svg class="arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </a>

                <a href="#" class="platform-btn android">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24c-2.86-1.21-6.08-1.21-8.94 0L5.65 5.67c-.19-.29-.51-.38-.83-.22-.31.16-.43.54-.26.85L6.4 9.48C3.3 11.25 1.28 14.44 1 18h22c-.28-3.56-2.3-6.75-5.4-8.52z"/>
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2z"/>
                  </svg>
                  <div class="btn-text">
                    <span class="btn-label">下载 APK 安装包</span>
                    <span class="btn-name">Android 版本</span>
                  </div>
                  <svg class="arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                  </svg>
                </a>
              </div>
            </div>

            <div class="card-footer">
              <div class="features-list">
                <span class="feature-tag">离线可用</span>
                <span class="feature-tag">推送通知</span>
                <span class="feature-tag">更流畅</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Feature Comparison -->
        <div class="comparison">
          <h2 class="section-title text-center">功能对比</h2>
          <div class="comparison-table">
            <div class="table-header">
              <span class="col-feature">功能</span>
              <span class="col-mini">小程序</span>
              <span class="col-app">APP</span>
            </div>
            <div class="table-row">
              <span class="col-feature">基础浏览</span>
              <span class="col-mini"><span class="check">✓</span></span>
              <span class="col-app"><span class="check">✓</span></span>
            </div>
            <div class="table-row">
              <span class="col-feature">拍照识材</span>
              <span class="col-mini"><span class="check">✓</span></span>
              <span class="col-app"><span class="check">✓</span></span>
            </div>
            <div class="table-row">
              <span class="col-feature">AI 菜谱</span>
              <span class="col-mini"><span class="check">✓</span></span>
              <span class="col-app"><span class="check">✓</span></span>
            </div>
            <div class="table-row">
              <span class="col-feature">收藏管理</span>
              <span class="col-mini"><span class="check">✓</span></span>
              <span class="col-app"><span class="check">✓</span></span>
            </div>
            <div class="table-row">
              <span class="col-feature">离线使用</span>
              <span class="col-mini"><span class="cross">-</span></span>
              <span class="col-app"><span class="check">✓</span></span>
            </div>
            <div class="table-row">
              <span class="col-feature">推送通知</span>
              <span class="col-mini"><span class="cross">-</span></span>
              <span class="col-app"><span class="check">✓</span></span>
            </div>
            <div class="table-row">
              <span class="col-feature">桌面小组件</span>
              <span class="col-mini"><span class="cross">-</span></span>
              <span class="col-app"><span class="check">✓</span></span>
            </div>
          </div>
        </div>

        <!-- FAQ -->
        <div class="faq">
          <h2 class="section-title text-center">常见问题</h2>
          <div class="faq-list">
            <div class="faq-item">
              <h3>Q: 小程序和 APP 数据互通吗？</h3>
              <p>A: 是的，登录同一账号后数据完全同步，你的收藏和历史记录在两端都能看到。</p>
            </div>
            <div class="faq-item">
              <h3>Q: APP 什么时候上线？</h3>
              <p>A: AIrecipe APP 正在紧锣密鼓开发中，预计近期上线，敬请期待！</p>
            </div>
            <div class="faq-item">
              <h3>Q: 使用需要付费吗？</h3>
              <p>A: AIrecipe 基础功能完全免费，部分高级功能可能需要订阅。</p>
            </div>
            <div class="faq-item">
              <h3>Q: 支持哪些手机系统？</h3>
              <p>A: 小程序支持所有智能手机，APP 支持 iOS 12+ 和 Android 7.0+ 系统。</p>
            </div>
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
.download-page {
  padding: var(--space-16) 0 var(--space-24);
}

.page-title {
  font-size: var(--text-4xl);
  text-align: center;
  margin-bottom: var(--space-4);
}

.page-subtitle {
  font-size: var(--text-lg);
  color: rgba(38, 37, 30, 0.55);
  text-align: center;
  margin-bottom: var(--space-12);
}

.download-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-8);
  margin-bottom: var(--space-16);
}

.download-card {
  background: var(--surface-300);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl);
  padding: var(--space-10);
  transition: all var(--transition-normal);

  &:hover {
    border-color: var(--border-medium);
    box-shadow: var(--shadow-lg);
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  margin-bottom: var(--space-8);
  padding-bottom: var(--space-6);
  border-bottom: 1px solid var(--border-primary);
}

.card-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  &.miniprogram {
    background: rgba(31, 138, 101, 0.15);
    color: #1f8a65;
  }

  &.app {
    background: rgba(245, 78, 0, 0.1);
    color: var(--cursor-orange);
  }
}

.card-title {
  h2 {
    font-size: var(--text-2xl);
    margin-bottom: var(--space-1);
  }

  p {
    font-size: var(--text-sm);
    color: rgba(38, 37, 30, 0.55);
  }
}

.card-body {
  margin-bottom: var(--space-8);
}

.qr-section {
  text-align: center;
  margin-bottom: var(--space-6);
}

.qr-code {
  display: inline-block;
  background: white;
  padding: var(--space-4);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-3);

  img {
    width: 160px;
    height: 160px;
  }
}

.qr-hint {
  font-size: var(--text-sm);
  color: rgba(38, 37, 30, 0.55);
}

.steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--surface-200);
  border-radius: var(--radius-md);
}

.step {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);

  .step-num {
    width: 24px;
    height: 24px;
    background: var(--cursor-orange);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--text-xs);
    font-weight: 600;
  }
}

.step-arrow {
  color: rgba(38, 37, 30, 0.3);
}

.platform-buttons {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.platform-btn {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5);
  background: var(--cursor-dark);
  color: white;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);

  &:hover {
    transform: translateX(4px);
    box-shadow: var(--shadow-md);
    color: white;
  }

  .btn-text {
    flex: 1;

    .btn-label {
      display: block;
      font-size: var(--text-xs);
      opacity: 0.7;
    }

    .btn-name {
      display: block;
      font-size: var(--text-base);
      font-weight: 500;
    }
  }

  .arrow {
    opacity: 0.5;
  }
}

.features-list {
  display: flex;
  gap: var(--space-3);
  justify-content: center;
}

.feature-tag {
  padding: var(--space-2) var(--space-4);
  background: var(--surface-200);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  color: rgba(38, 37, 30, 0.6);
}

.comparison {
  margin-bottom: var(--space-16);
}

.comparison-table {
  max-width: 600px;
  margin: 0 auto;
  background: var(--surface-300);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  padding: var(--space-4) var(--space-6);
}

.table-header {
  background: var(--cursor-dark);
  color: white;
  font-weight: 500;
  font-size: var(--text-sm);
}

.table-row {
  border-bottom: 1px solid var(--border-primary);
  font-size: var(--text-sm);

  &:last-child {
    border-bottom: none;
  }

  &:nth-child(even) {
    background: var(--surface-200);
  }
}

.col-feature {
  color: rgba(38, 37, 30, 0.8);
}

.col-mini,
.col-app {
  text-align: center;
}

.check {
  color: var(--color-success);
  font-weight: 600;
}

.cross {
  color: rgba(38, 37, 30, 0.3);
}

.faq {
  max-width: 700px;
  margin: 0 auto;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.faq-item {
  padding: var(--space-6);
  background: var(--surface-300);
  border-radius: var(--radius-md);

  h3 {
    font-size: var(--text-base);
    font-weight: 500;
    margin-bottom: var(--space-3);
    color: var(--cursor-dark);
  }

  p {
    font-size: var(--text-sm);
    color: rgba(38, 37, 30, 0.6);
    line-height: 1.7;
  }
}

@media (max-width: 768px) {
  .download-options {
    grid-template-columns: 1fr;
  }

  .steps {
    flex-wrap: wrap;
  }

  .comparison-table {
    font-size: var(--text-xs);
  }

  .table-header,
  .table-row {
    padding: var(--space-3) var(--space-4);
  }
}
</style>
