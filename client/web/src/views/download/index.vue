<template>
  <MainLayout>
    <section class="download-hero">
      <div class="container hero-grid">
        <div class="hero-copy reveal">
          <span class="kicker">Download</span>
          <h1 class="display-font">挑一个你最顺手的入口，先把今晚安排上。</h1>
          <p>下载页也一起收紧了结构，避免再出现之前那种大块空白和卡片偏位。现在两个入口都用同一套节奏来展示。</p>
        </div>

        <div class="hero-panel soft-card reveal">
          <img src="@/assets/logo.svg" alt="AIrecipe logo" />
          <strong>AIrecipe</strong>
          <span>拍照识材、生成菜谱、记录营养，一页说明清楚。</span>
        </div>
      </div>
    </section>

    <section class="options section">
      <div class="container option-grid">
        <article class="option-card soft-card reveal" id="miniprogram">
          <span class="option-label">01 / 微信小程序</span>
          <h2 class="display-font">扫一扫，马上开始。</h2>
          <p>适合第一次体验、临时找菜谱和快速转发给家人朋友。</p>
          <div class="qr-wrap">
            <img src="@/assets/qr-miniprogram.svg" alt="AIrecipe 小程序码" />
          </div>
          <ul>
            <li v-for="item in miniFeatures" :key="item">{{ item }}</li>
          </ul>
        </article>

        <article class="option-card dark-card reveal" id="app">
          <span class="option-label dark">02 / 独立 APP</span>
          <h2 class="display-font">记录更完整，使用更沉浸。</h2>
          <p>适合高频使用、长期收藏和离线查看。</p>
          <div class="store-stack">
            <button>App Store</button>
            <button>Android APK</button>
          </div>
          <ul>
            <li v-for="item in appFeatures" :key="item">{{ item }}</li>
          </ul>
        </article>
      </div>
    </section>

    <section class="compare section">
      <div class="container">
        <div class="section-header reveal">
          <span class="kicker">Compare</span>
          <h2 class="section-title">两个入口，一套体验逻辑。</h2>
        </div>

        <div class="compare-table soft-card reveal">
          <div class="table-row head">
            <span>能力</span>
            <span>小程序</span>
            <span>APP</span>
          </div>
          <div v-for="row in rows" :key="row.name" class="table-row">
            <span>{{ row.name }}</span>
            <span>{{ row.mini }}</span>
            <span>{{ row.app }}</span>
          </div>
        </div>
      </div>
    </section>
  </MainLayout>
</template>

<script setup lang="ts">
const miniFeatures = ['微信内即开即用', '扫码识别方便', '适合快速分享', '收藏记录同步']
const appFeatures = ['离线查看菜谱', '营养数据更完整', '提醒和收藏更集中', '切换页面更流畅']

const rows = [
  { name: '拍照识材', mini: '支持', app: '支持' },
  { name: 'AI 菜谱生成', mini: '支持', app: '支持' },
  { name: '营养追踪', mini: '基础', app: '完整' },
  { name: '离线使用', mini: '暂不支持', app: '支持' },
  { name: '收藏同步', mini: '支持', app: '支持' },
]
</script>

<style scoped lang="scss">
.download-hero {
  padding: calc(var(--header-height) + 56px) 0 48px;
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 0.72fr);
  gap: clamp(28px, 6vw, 72px);
  align-items: center;
}

.hero-copy h1 {
  max-width: 780px;
  font-size: clamp(2.8rem, 7vw, 5.8rem);
  line-height: 1.04;
}

.hero-copy p {
  max-width: 620px;
  margin-top: 18px;
  color: var(--text-secondary);
  font-size: 1.05rem;
  line-height: 1.85;
}

.hero-panel {
  display: grid;
  place-items: center;
  min-height: 320px;
  padding: 32px;
  border-radius: 30px;
  text-align: center;

  img {
    width: 110px;
    height: 110px;
    margin-bottom: 16px;
  }

  strong {
    font-size: 2rem;
    font-weight: 800;
  }

  span {
    max-width: 280px;
    margin-top: 10px;
    color: var(--text-secondary);
    line-height: 1.7;
  }
}

.option-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.option-card {
  padding: clamp(26px, 5vw, 44px);
  border-radius: 30px;

  h2 {
    margin: 22px 0 12px;
    font-size: clamp(2rem, 4vw, 3.5rem);
    line-height: 1.1;
  }

  p {
    margin: 0;
    line-height: 1.8;
  }

  ul {
    display: grid;
    gap: 10px;
    margin-top: 24px;
  }

  li {
    position: relative;
    padding-left: 18px;
    color: var(--text-secondary);
    font-weight: 650;
  }

  li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0.68em;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--accent);
  }
}

.dark-card {
  color: #fff9ee;
  background: #1b261f;

  p,
  li {
    color: rgba(255, 249, 238, 0.74);
  }

  li::before {
    background: var(--accent-2);
  }
}

.option-label {
  display: inline-flex;
  padding: 8px 12px;
  border-radius: 999px;
  color: var(--accent);
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  background: rgba(255, 122, 89, 0.12);
}

.option-label.dark {
  color: #fff9ee;
  background: rgba(255, 255, 255, 0.12);
}

.qr-wrap {
  width: 188px;
  margin-top: 24px;
  padding: 16px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.84);
  box-shadow: var(--shadow-card);
}

.store-stack {
  display: grid;
  gap: 12px;
  margin-top: 24px;
  max-width: 250px;

  button {
    min-height: 50px;
    border-radius: 18px;
    color: #fff9ee;
    font-weight: 700;
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.18);
  }
}

.compare-table {
  overflow: hidden;
  border-radius: 28px;
}

.table-row {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr;
  gap: 16px;
  padding: 18px 24px;
  color: var(--text-secondary);
  font-weight: 700;
  border-bottom: 1px solid var(--border-soft);

  &:last-child {
    border-bottom: 0;
  }
}

.head {
  color: #fff9ee;
  background: #1b261f;
}

@media (max-width: 820px) {
  .hero-grid,
  .option-grid {
    grid-template-columns: 1fr;
  }

  .table-row {
    grid-template-columns: 1fr;
  }
}
</style>
