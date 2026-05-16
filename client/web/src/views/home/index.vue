<template>
  <MainLayout>
    <!-- ── Hero ─────────────────────────────────────── -->
    <section class="hero">
      <!-- Background glows -->
      <div class="hero-glow glow-left" aria-hidden="true"></div>
      <div class="hero-glow glow-right" aria-hidden="true"></div>

      <div class="container hero-inner">
        <!-- Left: Copy -->
        <div class="hero-copy">
          <span class="kicker reveal">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            AI 智能菜谱
          </span>

          <h1 class="hero-title reveal" style="--i: 1">
            让冰箱里的食材，<br />先变成灵感。
          </h1>

          <p class="hero-desc reveal" style="--i: 2">
            拍一下识别食材，AI 生成今日菜谱，同步营养数据。小程序和 APP 数据互通，做饭记录不再断档。
          </p>

          <div class="hero-cta reveal" style="--i: 3">
            <LiquidGlass
              class-name="cta-liquid-hero"
              padding="0"
              :corner-radius="22"
              :displacement-scale="30"
              :blur-amount="0.05"
              :saturation="130"
              :aberration-intensity="0.8"
              :elasticity="0.14"
              :mode="GlassMode.prominent"
              @click="scrollTo('download')"
            >
              <button class="btn-cta-primary">
                立即体验
                <span class="btn-icon-wrap">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </button>
            </LiquidGlass>

            <a href="#features" class="btn btn-ghost" @click.prevent="scrollTo('features')">
              了解更多
            </a>
          </div>

          <!-- Stats -->
          <div class="hero-stats reveal" style="--i: 4">
            <div v-for="stat in stats" :key="stat.label" class="stat-item">
              <strong class="stat-value">{{ stat.value }}</strong>
              <span class="stat-label">{{ stat.label }}</span>
            </div>
          </div>
        </div>

        <!-- Right: Visual -->
        <div class="hero-visual reveal-scale">
          <!-- Outer bezel shell -->
          <div class="hero-bezel">
            <div class="hero-bezel-inner">
              <!-- Phone preview -->
              <div class="phone-shell soft-card">
                <div class="phone-topbar">
                  <div class="mascot-pill">
                    <img src="@/assets/logo.svg" alt="AIrecipe" />
                    <span>今晚开饭啦</span>
                  </div>
                  <span class="topbar-tag">拍照识材 · 营养记录</span>
                </div>

                <div class="phone-hero-img">
                  <img src="@/assets/hero-app.svg" alt="AIrecipe 应用界面" />
                </div>

                <div class="phone-cards">
                  <article class="side-info-card side-info-dark">
                    <span class="side-kicker">今日推荐</span>
                    <h3 class="side-title">番茄滑蛋饭</h3>
                    <p class="side-desc">3 种食材，15 分钟，口味清爽。</p>
                  </article>

                  <article class="side-info-card side-info-light">
                    <div class="bubble-pills">
                      <span>蛋白 72%</span>
                      <span>碳水 58%</span>
                    </div>
                    <div class="mini-bars">
                      <i style="width: 72%"></i>
                      <i style="width: 58%"></i>
                      <i style="width: 41%"></i>
                    </div>
                  </article>
                </div>
              </div>

              <!-- Floating accent card -->
              <div class="float-card float-card-1 soft-card">
                <div class="float-card-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <div>
                  <strong>AI 实时生成</strong>
                  <span>新菜谱 3 秒出</span>
                </div>
              </div>

              <!-- Floating ingredient tag -->
              <div class="float-card float-card-2 soft-card">
                <span class="ingredient-dot"></span>
                <span>检测到 8 种可用食材</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Features / Bento Grid ───────────────────── -->
    <section class="features section" id="features">
      <div class="container">
        <div class="section-intro reveal">
          <span class="kicker">核心功能</span>
          <h2 class="section-title">
            每一餐的灵感，<br />从识别食材开始。
          </h2>
          <p class="section-desc">
            不再让功能藏在一堆卡片和弹窗里。四块清晰分区，扫一眼就知道怎么用。
          </p>
        </div>

        <div class="bento-grid">
          <!-- Feature 1: Scan — Large left card -->
          <article class="bento-card bento-large reveal spotlight-card" style="--i: 0">
            <div class="feature-icon-wrap tone-mint">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 8V5a1 1 0 0 1 1-1h3" />
                <path d="M16 4h3a1 1 0 0 1 1 1v3" />
                <path d="M20 16v3a1 1 0 0 1-1 1h-3" />
                <path d="M8 20H5a1 1 0 0 1-1-1v-3" />
                <circle cx="12" cy="12" r="3.5" />
              </svg>
            </div>
            <h3 class="feature-title">拍照识材</h3>
            <p class="feature-desc">对准冰箱或菜篮，快速识别食材种类和可用搭配，自动整理成清单，新鲜度也能估算。</p>
            <div class="feature-extra">
              <span class="tag-pill">AI 视觉识别</span>
              <span class="tag-pill">多物同辨</span>
            </div>
          </article>

          <!-- Feature 2: Recipe — Right tall card -->
          <article class="bento-card bento-tall reveal spotlight-card" style="--i: 1">
            <div class="feature-icon-wrap tone-peach">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M7 4h10" />
                <path d="M9 4v4" />
                <path d="M15 4v4" />
                <path d="M5 10h14" />
                <path d="M7 10l1 8h8l1-8" />
                <path d="M10 14h4" />
              </svg>
            </div>
            <h3 class="feature-title">AI 菜谱生成</h3>
            <p class="feature-desc">按口味偏好、时间和用餐人数生成菜谱，步骤清晰，营养数据同步呈现。</p>
            <div class="feature-visual">
              <div class="recipe-step-preview">
                <span class="step-n">01</span>
                <span class="step-text">热油下蛋液</span>
              </div>
              <div class="recipe-step-preview">
                <span class="step-n">02</span>
                <span class="step-text">加番茄翻炒</span>
              </div>
              <div class="recipe-step-preview">
                <span class="step-n">03</span>
                <span class="step-text">调味出锅</span>
              </div>
            </div>
          </article>

          <!-- Feature 3: Nutrition — Wide bottom left -->
          <article class="bento-card bento-wide reveal spotlight-card" style="--i: 2">
            <div class="feature-icon-wrap tone-cream">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 20V10" />
                <path d="M12 20V4" />
                <path d="M6 20v-6" />
              </svg>
            </div>
            <h3 class="feature-title">营养追踪</h3>
            <p class="feature-desc">蛋白质、碳水、脂肪一眼扫完，不需要翻层就能看到今天的营养目标完成度。</p>
            <div class="nutrition-mini-bars">
              <div v-for="bar in nutritionBars" :key="bar.label" class="nbar-row">
                <span class="nbar-label">{{ bar.label }}</span>
                <div class="nbar-track"><i :style="{ width: bar.value }"></i></div>
                <strong class="nbar-val">{{ bar.value }}</strong>
              </div>
            </div>
          </article>

          <!-- Feature 4: Sync — Small right bottom -->
          <article class="bento-card bento-small reveal spotlight-card" style="--i: 3">
            <div class="feature-icon-wrap tone-mint">
              <img src="@/assets/logo.svg" alt="" class="icon-img" />
            </div>
            <h3 class="feature-title">收藏同步</h3>
            <p class="feature-desc">小程序和 APP 共用一个账号，收藏、历史、营养记录跨端保持一致。</p>
          </article>
        </div>
      </div>
    </section>

    <!-- ── Workflow ───────────────────────────────── -->
    <section class="workflow section" id="workflow">
      <div class="container workflow-inner">
        <div class="workflow-copy">
          <span class="kicker reveal">使用流程</span>
          <h2 class="section-title reveal" style="--i: 1">
            三步，<br />从食材到上桌。
          </h2>
          <p class="section-desc reveal" style="--i: 2">
            把之前会互相压住的绝对定位卡片撤掉了，流程按顺序展开，桌面和移动端都顺滑。
          </p>
        </div>

        <div class="workflow-steps">
          <div
            v-for="(step, i) in workflowSteps"
            :key="step.title"
            class="workflow-step reveal"
            :style="`--i: ${i}`"
          >
            <div class="step-connector" aria-hidden="true"></div>
            <div class="step-number">{{ String(i + 1).padStart(2, '0') }}</div>
            <div class="step-content">
              <h3 class="step-title">{{ step.title }}</h3>
              <p class="step-desc">{{ step.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Stats ──────────────────────────────────── -->
    <section class="stats-section">
      <div class="container">
        <div class="stats-board reveal">
          <div class="stats-copy">
            <span class="kicker kicker-dark">数据说话</span>
            <h2 class="stats-headline display-font">
              越来越多的厨房，<br />开始用它找灵感。
            </h2>
          </div>

          <div class="stats-grid">
            <div v-for="s in bigStats" :key="s.label" class="stat-block">
              <strong class="big-num">{{ s.value }}</strong>
              <span class="big-label">{{ s.label }}</span>
              <p class="big-sub">{{ s.sub }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Testimonials ───────────────────────────── -->
    <section class="testimonials section">
      <div class="container">
        <div class="section-intro reveal">
          <span class="kicker">真实反馈</span>
          <h2 class="section-title">用过的人怎么说。</h2>
        </div>

        <div class="testimonial-track" ref="trackRef">
          <div class="testimonial-list">
            <article v-for="t in testimonials" :key="t.name" class="testimonial-card reveal">
              <div class="testimonial-stars" aria-label="5星">
                <svg v-for="n in 5" :key="n" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <blockquote class="testimonial-quote">"{{ t.quote }}"</blockquote>
              <div class="testimonial-author">
                <div class="author-avatar" :style="{ background: t.avatar }">
                  {{ t.initials }}
                </div>
                <div>
                  <strong class="author-name">{{ t.name }}</strong>
                  <span class="author-role">{{ t.role }}</span>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Download / CTA ─────────────────────────── -->
    <section class="download section" id="download">
      <div class="container">
        <div class="download-layout">
          <!-- Left: Mini program QR -->
          <div class="download-qr reveal">
            <div class="qr-card soft-card">
              <span class="kicker">微信小程序</span>
              <h2 class="qr-title display-font">扫一扫，<br />立刻开始。</h2>
              <p class="qr-desc">适合第一次体验、快速分享和临时找菜谱。</p>
              <div class="qr-box">
                <img src="@/assets/qr-miniprogram.svg" alt="AIrecipe 小程序码" />
              </div>
            </div>
          </div>

          <!-- Right: App cards -->
          <div class="download-apps">
            <div class="app-card app-card-primary reveal" style="--i: 0">
              <div class="app-card-inner">
                <span class="kicker kicker-dark">独立 APP</span>
                <h3 class="app-title display-font">长期记录更完整。</h3>
                <p class="app-desc">适合高频使用、离线查看、收藏同步和营养提醒。</p>
                <div class="store-btns">
                  <button class="store-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    App Store
                  </button>
                  <button class="store-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                    </svg>
                    Android APK
                  </button>
                </div>
              </div>
            </div>

            <div class="app-card app-card-secondary reveal" style="--i: 1">
              <div class="app-card-inner">
                <div class="sync-preview">
                  <div class="sync-node">
                    <img src="@/assets/logo.svg" alt="" />
                    <span>小程序</span>
                  </div>
                  <div class="sync-arrow">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                  <div class="sync-node">
                    <img src="@/assets/logo.svg" alt="" />
                    <span>APP</span>
                  </div>
                </div>
                <p class="sync-desc">数据实时双向同步，换设备也不丢记录。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── FAQ ─────────────────────────────────────── -->
    <section class="faq section" id="faq">
      <div class="container faq-layout">
        <div class="faq-copy reveal">
          <span class="kicker">常见问题</span>
          <h2 class="section-title">几个你可能会关心的问题。</h2>
        </div>

        <div class="faq-list">
          <details v-for="item in faqs" :key="item.q" class="faq-item reveal">
            <summary class="faq-question">
              <span>{{ item.q }}</span>
              <span class="faq-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" class="icon-v" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </span>
            </summary>
            <p class="faq-answer">{{ item.a }}</p>
          </details>
        </div>
      </div>
    </section>
  </MainLayout>
</template>

<script setup lang="ts">
import { GlassMode, LiquidGlass } from '@wxperia/liquid-glass-vue'
import MainLayout from '@/components/layout/MainLayout.vue'
import { ref } from 'vue'

const trackRef = ref<HTMLElement | null>(null)

// Hero stats
const stats = [
  { value: '10K+', label: '精品菜谱' },
  { value: '50K+', label: '灵感生成' },
  { value: '4.8', label: '体验评分' },
]

// Features
const nutritionBars = [
  { label: '蛋白质', value: '72%' },
  { label: '蔬菜量', value: '84%' },
  { label: '热量目标', value: '63%' },
]

// Workflow
const workflowSteps = [
  { title: '拍一下', desc: '识别食材、估算新鲜度，并把可用食材整理成清单。' },
  { title: '选偏好', desc: '按口味、时间和忌口收窄方案，避免一上来信息太多。' },
  { title: '照着做', desc: '步骤、营养和收藏都放在稳定的阅读区里，滚动更顺。' },
]

// Stats section
const bigStats = [
  { value: '10,847', label: '收录菜谱', sub: '覆盖主流中餐、家常菜和快手菜' },
  { value: '47,293', label: 'AI 生成次数', sub: '按用户食材实时组合生成' },
  { value: '4.87', label: '综合评分', sub: '基于真实用户使用反馈' },
]

// Testimonials
const testimonials = [
  {
    quote: '以前总纠结吃什么，现在拍照就出菜谱，步骤还特别清楚，太省心了。',
    name: '陈晓楠',
    initials: '陈',
    role: '上班族，健身爱好者',
    avatar: 'linear-gradient(135deg, #79d7b9, #4ecdc4)',
  },
  {
    quote: '营养追踪功能帮我控制饮食，搭配 APP 记录，一周瘦了 2 斤。',
    name: '林佳琪',
    initials: '林',
    role: '营养管理中',
    avatar: 'linear-gradient(135deg, #ffc574, #ff9a44)',
  },
  {
    quote: '收藏同步太实用了，手机看完菜谱，APP 同步保存，出门买菜直接用。',
    name: '张铭远',
    initials: '张',
    role: '家庭厨师',
    avatar: 'linear-gradient(135deg, #ff7a59, #ff6b6b)',
  },
  {
    quote: '拍照识别特别准，连我冰箱里快过期的食材都提示了，帮我减少浪费。',
    name: '王雨晴',
    initials: '王',
    role: '可持续生活践行者',
    avatar: 'linear-gradient(135deg, #a8e6cf, #56ab91)',
  },
]

// FAQ
const faqs = [
  {
    q: '小程序和 APP 数据会互通吗？',
    a: '页面文案和结构按互通来设计，后续接同一账号体系后，收藏、历史和营养记录都可以同步。',
  },
  {
    q: '识别食材的准确率怎么样？',
    a: '目前支持常见蔬菜、水果、肉类、豆制品等超过 200 种食材的识别，准确率在 94% 以上。',
  },
  {
    q: 'AI 生成的菜谱是怎么来的？',
    a: '系统会根据你输入的食材、口味偏好、时间和人数，结合营养学知识，从菜谱库中智能匹配并组合生成。',
  },
  {
    q: '营养数据是怎么计算的？',
    a: '基于中国食物成分数据库，每道菜的营养数据都经过标准化计算，并按实际用量进行换算。',
  },
]

function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<style scoped lang="scss">
// ── Hero ──────────────────────────────────────────
.hero {
  position: relative;
  padding: calc(var(--header-height) + 60px) 0 80px;
  overflow: hidden;
}

.hero-glow {
  position: absolute;
  width: 40vw;
  height: 40vw;
  border-radius: 999px;
  pointer-events: none;
  filter: blur(12px);
}

.glow-left {
  left: -12vw;
  bottom: -10vw;
  background: radial-gradient(circle, rgba(121, 215, 185, 0.2), transparent 65%);
}

.glow-right {
  top: -8vw;
  right: -8vw;
  background: radial-gradient(circle, rgba(255, 197, 116, 0.22), transparent 65%);
}

.hero-inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(420px, 0.9fr);
  gap: clamp(32px, 6vw, 80px);
  align-items: center;
}

.hero-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.hero-title {
  margin-top: 20px;
  font-size: clamp(3.2rem, 6.5vw, 6rem);
  font-weight: 900;
  line-height: 1.02;
  letter-spacing: -0.04em;
  color: var(--text-primary);
}

.hero-desc {
  margin-top: 20px;
  max-width: 560px;
  font-size: clamp(1rem, 1.6vw, 1.12rem);
  line-height: 1.85;
  color: var(--text-secondary);
  font-weight: 500;
}

.hero-cta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 32px;
}

.cta-liquid-hero {
  display: inline-flex;
}

.btn-cta-primary {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 52px;
  padding: 0 22px;
  border-radius: var(--radius-full);
  font-size: 0.95rem;
  font-weight: 700;
  color: #fff9ee;
  background: linear-gradient(135deg, #1b261f, #2d3c33);
  box-shadow: var(--shadow-sm);
  transition: transform var(--duration-fast) var(--ease-spring), box-shadow var(--duration-base) var(--ease-spring);

  &:active { transform: scale(0.97); }
  &:hover { box-shadow: var(--shadow-md); }
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-top: 40px;
  padding-top: 32px;
  border-top: 1px solid var(--border-soft);
  width: 100%;
  max-width: 460px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: clamp(1.5rem, 2.5vw, 2rem);
  font-weight: 900;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
}

.stat-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-muted);
}

// Hero Visual / Bezel
.hero-visual {
  perspective: 1000px;
}

.hero-bezel {
  border-radius: var(--radius-2xl);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-mid);
  padding: 2px;
  box-shadow: var(--shadow-xl);
}

.hero-bezel-inner {
  position: relative;
  border-radius: calc(var(--radius-2xl) - 2px);
  background: var(--surface);
  padding: 24px;
  overflow: visible;
}

.phone-shell {
  padding: 18px;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.phone-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.mascot-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.6);
  font-size: 0.82rem;
  font-weight: 700;

  img { width: 22px; height: 22px; }
}

.topbar-tag {
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--text-muted);
}

.phone-hero-img {
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-bottom: 14px;

  img {
    width: 100%;
    border-radius: var(--radius-md);
    display: block;
  }
}

.phone-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.side-info-card {
  padding: 16px;
  border-radius: var(--radius-md);
}

.side-info-dark {
  background: #1b261f;
  color: #fff9ee;
}

.side-info-light {
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid var(--border-soft);
}

.side-kicker {
  display: block;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 6px;
  opacity: 0.7;
}

.side-title {
  font-size: 1.1rem;
  font-weight: 800;
  margin-bottom: 4px;
  line-height: 1.2;
}

.side-desc {
  font-size: 0.78rem;
  font-weight: 500;
  line-height: 1.5;
  opacity: 0.72;
}

.bubble-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;

  span {
    padding: 4px 10px;
    border-radius: var(--radius-full);
    font-size: 0.72rem;
    font-weight: 700;
    background: #fff0cf;
    color: #1b261f;
  }
}

.mini-bars {
  display: flex;
  flex-direction: column;
  gap: 6px;

  i {
    display: block;
    height: 7px;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--accent-2), var(--accent-3), var(--accent));
  }
}

// Floating accent cards
.float-card {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  font-size: 0.8rem;
  font-weight: 700;
  backdrop-filter: blur(16px);
}

.float-card-1 {
  top: -16px;
  right: -20px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: var(--shadow-md);
  animation: floatUp 4s ease-in-out infinite;

  .float-card-icon {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-sm);
    background: var(--accent-soft);
    color: var(--accent);
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }

  strong { display: block; font-size: 0.88rem; }
  span { display: block; font-size: 0.75rem; color: var(--text-muted); font-weight: 500; }
}

.float-card-2 {
  bottom: -14px;
  left: -18px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow: var(--shadow-sm);
  animation: floatDown 5s ease-in-out infinite;

  .ingredient-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--accent-2);
    flex-shrink: 0;
    box-shadow: 0 0 0 3px rgba(121, 215, 185, 0.25);
  }
}

@keyframes floatUp {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes floatDown {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(6px); }
}

// ── Features / Bento ────────────────────────────────
.features {
  background: transparent;
}

.section-intro {
  margin-bottom: clamp(32px, 5vw, 56px);
}

.section-title {
  margin-top: 16px;
  font-size: clamp(2rem, 4.5vw, 4rem);
  font-weight: 900;
  letter-spacing: -0.035em;
  line-height: 1.05;
  max-width: 640px;
}

.section-desc {
  margin-top: 16px;
  max-width: 560px;
  font-size: clamp(0.95rem, 1.5vw, 1.08rem);
  color: var(--text-secondary);
  line-height: 1.85;
  font-weight: 500;
}

.bento-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-template-rows: auto auto;
  gap: 16px;
}

.bento-card {
  padding: 28px;
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bento-large {
  grid-column: span 7;
  grid-row: span 1;
}

.bento-tall {
  grid-column: span 5;
  grid-row: span 1;
}

.bento-wide {
  grid-column: span 8;
}

.bento-small {
  grid-column: span 4;
}

.feature-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md);
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.tone-mint { background: rgba(121, 215, 185, 0.18); color: #2d9a70; }
.tone-peach { background: rgba(255, 122, 89, 0.14); color: #d44f28; }
.tone-cream { background: rgba(255, 197, 116, 0.18); color: #c07020; }

.icon-img {
  width: 28px;
  height: 28px;
}

.feature-title {
  font-size: 1.3rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.feature-desc {
  font-size: 0.92rem;
  font-weight: 500;
  color: var(--text-secondary);
  line-height: 1.75;
  flex: 1;
}

.feature-extra {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.tag-pill {
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: 0.76rem;
  font-weight: 700;
  background: rgba(27, 38, 31, 0.06);
  color: var(--text-secondary);
  border: 1px solid var(--border-soft);
}

.feature-visual {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

.recipe-step-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  background: rgba(27, 38, 31, 0.04);
  border: 1px solid var(--border-soft);
}

.step-n {
  font-size: 0.72rem;
  font-weight: 800;
  font-family: var(--font-mono);
  color: var(--accent);
  flex-shrink: 0;
}

.step-text {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
}

.nutrition-mini-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 4px;
}

.nbar-row {
  display: grid;
  grid-template-columns: 72px 1fr 48px;
  align-items: center;
  gap: 10px;
}

.nbar-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.nbar-track {
  height: 8px;
  border-radius: 999px;
  background: rgba(27, 38, 31, 0.07);
  overflow: hidden;

  i {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--accent-2), var(--accent-3), var(--accent));
  }
}

.nbar-val {
  font-size: 0.8rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

// ── Workflow ──────────────────────────────────────
.workflow-inner {
  display: grid;
  grid-template-columns: minmax(0, 0.88fr) minmax(0, 1fr);
  gap: clamp(28px, 6vw, 72px);
  align-items: start;
}

.workflow-steps {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.workflow-step {
  position: relative;
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 20px;
  padding: 24px 0;
  border-bottom: 1px solid var(--border-soft);

  &:last-child { border-bottom: none; }
}

.step-connector {
  position: absolute;
  left: 27px;
  top: 56px;
  bottom: 0;
  width: 2px;
  background: linear-gradient(180deg, var(--accent) 0%, transparent 100%);
  opacity: 0.3;
}

.step-number {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md);
  background: var(--surface-dark);
  color: #fff9ee;
  display: grid;
  place-items: center;
  font-size: 1rem;
  font-weight: 900;
  font-family: var(--font-mono);
  letter-spacing: -0.03em;
  flex-shrink: 0;
}

.step-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
}

.step-title {
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.step-desc {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-secondary);
  line-height: 1.75;
}

// ── Stats ─────────────────────────────────────────
.stats-section {
  padding: var(--section-gap) 0;
  background: var(--surface-dark);
  margin: 0 calc(-1 * var(--content-padding));
  padding-left: var(--content-padding);
  padding-right: var(--content-padding);
  border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
  margin-top: 0;
}

.stats-board {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1fr);
  gap: clamp(28px, 6vw, 80px);
  align-items: center;
}

.kicker-dark {
  color: rgba(255, 249, 238, 0.7);
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.12);
}

.stats-headline {
  margin-top: 16px;
  font-size: clamp(2rem, 4.5vw, 3.8rem);
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: -0.03em;
  color: #fff9ee;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.stat-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.big-num {
  font-size: clamp(2rem, 4vw, 3.2rem);
  font-weight: 900;
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
  color: #fff9ee;
  line-height: 1;
}

.big-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: rgba(255, 249, 238, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-top: 6px;
}

.big-sub {
  font-size: 0.8rem;
  font-weight: 500;
  color: rgba(255, 249, 238, 0.4);
  line-height: 1.55;
  margin-top: 4px;
}

// ── Testimonials ──────────────────────────────────
.testimonial-track {
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar { display: none; }
}

.testimonial-list {
  display: flex;
  gap: 20px;
  padding-bottom: 12px;
  width: max-content;
}

.testimonial-card {
  flex: 0 0 340px;
  padding: 28px;
  border-radius: var(--radius-lg);
  background: var(--surface);
  border: 1px solid var(--border-soft);
  box-shadow: var(--shadow-sm);
  scroll-snap-align: start;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: box-shadow var(--duration-base) var(--ease-spring), transform var(--duration-base) var(--ease-spring);

  &:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-3px);
  }
}

.testimonial-stars {
  display: flex;
  gap: 3px;
  color: var(--accent);
}

.testimonial-quote {
  font-size: 0.95rem;
  font-weight: 500;
  line-height: 1.75;
  color: var(--text-primary);
  font-style: normal;
  flex: 1;
}

.testimonial-author {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 0.9rem;
  font-weight: 800;
  flex-shrink: 0;
}

.author-name {
  display: block;
  font-size: 0.9rem;
  font-weight: 700;
}

.author-role {
  display: block;
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--text-muted);
  margin-top: 2px;
}

// ── Download ─────────────────────────────────────
.download-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  gap: 24px;
  align-items: start;
}

.download-apps {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.qr-card {
  padding: 32px;
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.qr-title {
  font-size: clamp(1.8rem, 3.5vw, 3rem);
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: -0.03em;
}

.qr-desc {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-secondary);
  line-height: 1.65;
}

.qr-box {
  width: 160px;
  margin-top: 8px;
  padding: 14px;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--border-soft);
  box-shadow: var(--shadow-sm);

  img {
    width: 100%;
    display: block;
  }
}

.app-card {
  border-radius: var(--radius-xl);
  overflow: hidden;
  transition: transform var(--duration-base) var(--ease-spring), box-shadow var(--duration-base) var(--ease-spring);

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
  }
}

.app-card-primary {
  background: var(--surface-dark);
  padding: 32px;
}

.app-card-inner {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.app-title {
  font-size: clamp(1.6rem, 3vw, 2.4rem);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: #fff9ee;
}

.app-desc {
  font-size: 0.9rem;
  font-weight: 500;
  color: rgba(255, 249, 238, 0.6);
  line-height: 1.65;
}

.store-btns {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
}

.store-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #fff9ee;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    background var(--duration-fast) var(--ease-spring),
    transform var(--duration-fast) var(--ease-spring);

  &:hover {
    background: rgba(255, 255, 255, 0.14);
    transform: translateX(4px);
  }

  &:active { transform: scale(0.98); }
}

.app-card-secondary {
  background: rgba(27, 38, 31, 0.04);
  border: 1px solid var(--border-soft);
  padding: 24px;
}

.sync-preview {
  display: flex;
  align-items: center;
  gap: 16px;
}

.sync-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;

  img { width: 44px; height: 44px; border-radius: var(--radius-sm); }
  span { font-size: 0.78rem; font-weight: 600; color: var(--text-secondary); }
}

.sync-arrow {
  color: var(--accent);
  flex-shrink: 0;
}

.sync-desc {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary);
  line-height: 1.6;
}

// ── FAQ ─────────────────────────────────────────────
.faq-layout {
  display: grid;
  grid-template-columns: minmax(0, 0.78fr) minmax(0, 1fr);
  gap: clamp(28px, 6vw, 72px);
  align-items: start;
}

.faq-copy {
  position: sticky;
  top: 100px;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.faq-item {
  padding: 20px 24px;
  border-radius: var(--radius-md);
  background: var(--surface);
  border: 1px solid var(--border-soft);
  box-shadow: var(--shadow-xs);
  transition:
    border-color var(--duration-base) var(--ease-spring),
    box-shadow var(--duration-base) var(--ease-spring);

  &:hover {
    border-color: var(--border-mid);
    box-shadow: var(--shadow-sm);
  }

  &[open] {
    border-color: rgba(255, 122, 89, 0.2);
    box-shadow: var(--shadow-sm);
  }
}

.faq-question {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--text-primary);
  user-select: none;
  list-style: none;

  &::-webkit-details-marker { display: none; }
}

.faq-icon {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-xs);
  background: rgba(27, 38, 31, 0.06);
  flex-shrink: 0;
  color: var(--text-secondary);
  transition:
    background var(--duration-base) var(--ease-spring),
    color var(--duration-base) var(--ease-spring),
    transform var(--duration-base) var(--ease-spring);

  .icon-v {
    transition: opacity var(--duration-base) var(--ease-spring);
  }

  .faq-item[open] & {
    background: var(--accent-soft);
    color: var(--accent);
    transform: rotate(45deg);
  }
}

.faq-answer {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--border-soft);
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-secondary);
  line-height: 1.8;
}

// ── Responsive ────────────────────────────────────
@media (max-width: 1100px) {
  .bento-large { grid-column: span 6; }
  .bento-tall { grid-column: span 6; }
  .bento-wide { grid-column: span 12; }
  .bento-small { grid-column: span 12; }
}

@media (max-width: 960px) {
  .hero-inner,
  .workflow-inner,
  .stats-board,
  .download-layout,
  .faq-layout {
    grid-template-columns: 1fr;
  }

  .faq-copy {
    position: static;
  }

  .hero-visual { order: -1; }

  .bento-large,
  .bento-tall,
  .bento-wide,
  .bento-small {
    grid-column: span 12;
  }

  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 700px) {
  .hero-stats {
    grid-template-columns: 1fr 1fr 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .download-layout {
    grid-template-columns: 1fr;
  }

  .phone-cards {
    grid-template-columns: 1fr;
  }

  .nbar-row {
    grid-template-columns: 64px 1fr 44px;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: clamp(2.4rem, 12vw, 3.6rem);
  }

  .hero-stats {
    grid-template-columns: 1fr 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
