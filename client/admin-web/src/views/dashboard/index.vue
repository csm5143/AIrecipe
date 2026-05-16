<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">数据看板</h2>
        <p class="text-muted">实时了解平台运营状态</p>
      </div>
      <div class="header-actions">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          size="default"
          style="width: 260px"
        />
        <el-button :icon="Refresh" :loading="isRefreshing" @click="fetchStats">
          {{ isRefreshing ? '刷新中...' : '刷新数据' }}
        </el-button>
        <span v-if="lastUpdated" class="last-updated">更新于 {{ lastUpdated }}</span>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div v-for="stat in statCards" :key="stat.key" class="stat-card" :style="{ '--accent-color': stat.color }">
        <div class="stat-header">
          <div class="stat-icon">
            <el-icon><component :is="stat.icon" /></el-icon>
          </div>
          <div class="stat-trend" :class="{ negative: stat.change < 0 }">
            <el-icon v-if="stat.change >= 0"><TrendCharts /></el-icon>
            <el-icon v-else><Bottom /></el-icon>
            <span>{{ Math.abs(stat.change) }}%</span>
          </div>
        </div>
        <div class="stat-value">{{ formatNumber(stat.value) }}</div>
        <div class="stat-label">{{ stat.label }}</div>
        <div class="stat-sublabel">较上{{ stat.period }}</div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-row">
      <div class="chart-card chart-main">
        <div class="chart-header">
          <h3 class="chart-title">数据趋势</h3>
          <div class="chart-legend">
            <span v-for="(name, i) in ['用户增长', '食谱创建']" :key="name" class="legend-item">
              <span class="legend-dot" :style="{ background: ['#f54e00', '#1f8a65'][i] }"></span>
              {{ name }}
            </span>
          </div>
        </div>
        <div ref="trendChartRef" class="chart-container"></div>
      </div>

      <div class="chart-card chart-secondary">
        <div class="chart-header">
          <h3 class="chart-title">食谱分类分布</h3>
        </div>
        <div ref="pieChartRef" class="chart-container chart-container-pie"></div>
      </div>
    </div>

    <!-- 下方数据区域 -->
    <div class="bottom-row">
      <div class="card-container data-table">
        <div class="table-header">
          <h3 class="table-title">最新反馈</h3>
          <el-button type="text" @click="router.push('/feedbacks')">查看全部</el-button>
        </div>
        <el-table :data="recentFeedbacks" size="small" :show-header="true">
          <el-table-column prop="content" label="反馈内容" min-width="200" :show-overflow-tooltip="true">
            <template #default="{ row }">
              <span class="feedback-content">{{ row.content }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              <span class="cursor-pill" :class="getTypeClass(row.type)">{{ row.typeText }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <span class="cursor-pill" :class="getStatusClass(row.status)">{{ row.statusText }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="时间" width="120">
            <template #default="{ row }">
              <span class="text-muted text-small">{{ row.createdAt }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="card-container quick-actions">
        <div class="table-header">
          <h3 class="table-title">快捷操作</h3>
        </div>
        <div class="quick-actions-grid">
          <button class="quick-action-btn" @click="router.push('/recipes/create')">
            <div class="action-icon" style="background: rgba(245, 78, 0, 0.1); color: var(--cursor-orange)">
              <el-icon><Plus /></el-icon>
            </div>
            <span>创建食谱</span>
          </button>
          <button class="quick-action-btn" @click="router.push('/ingredients')">
            <div class="action-icon" style="background: rgba(31, 138, 101, 0.1); color: var(--color-success)">
              <el-icon><Food /></el-icon>
            </div>
            <span>添加食材</span>
          </button>
          <button class="quick-action-btn" @click="router.push('/content')">
            <div class="action-icon" style="background: rgba(74, 125, 191, 0.1); color: var(--color-info)">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <span>内容运营</span>
          </button>
          <button class="quick-action-btn" @click="router.push('/system/operation-logs')">
            <div class="action-icon" style="background: rgba(212, 136, 14, 0.1); color: var(--color-warning)">
              <el-icon><Document /></el-icon>
            </div>
            <span>查看日志</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  User,
  Food,
  Collection,
  ChatDotRound,
  Refresh,
  TrendCharts,
  Bottom,
  Plus,
  Document
} from '@element-plus/icons-vue';
import * as echarts from 'echarts';
import type { ECharts } from 'echarts';
import { analyticsApi } from '@/api/analytics';

const router = useRouter();

const dateRange = ref<[Date, Date] | null>(null);
const trendChartRef = ref<HTMLElement>();
const pieChartRef = ref<HTMLElement>();
let trendChart: ECharts | null = null;
let pieChart: ECharts | null = null;

interface StatCard {
  key: string;
  label: string;
  value: number;
  icon: any;
  color: string;
  change: number;
  period: string;
}

const statCards = ref<StatCard[]>([
  { key: 'users', label: '用户总数', value: 0, icon: User, color: '#f54e00', change: 0, period: '月' },
  { key: 'recipes', label: '菜谱总数', value: 0, icon: Food, color: '#1f8a65', change: 0, period: '月' },
  { key: 'collections', label: '收藏总量', value: 0, icon: Collection, color: '#4a7dbf', change: 0, period: '月' },
  { key: 'feedbacks', label: '反馈总数', value: 0, icon: ChatDotRound, color: '#d4880e', change: 0, period: '月' },
]);

const isRefreshing = ref(false);
const lastUpdated = ref('');
let refreshTimer: ReturnType<typeof setInterval> | null = null;

interface RecentFeedback {
  id: number;
  content: string;
  type: string;
  typeText: string;
  status: string;
  statusText: string;
  createdAt: string;
}

const recentFeedbacks = ref<RecentFeedback[]>([]);

function formatNumber(num: number): string {
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
  return num.toLocaleString();
}

function updateLastUpdated() {
  lastUpdated.value = new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getTypeClass(type: string): string {
  const map: Record<string, string> = {
    bug_report: 'warning',
    feature_request: 'info',
    content_issue: 'warning',
    improvement: 'info',
    other: 'info',
  };
  return map[type] || 'info';
}

function getStatusClass(status: string): string {
  const map: Record<string, string> = {
    pending: 'warning',
    in_progress: 'info',
    replied: 'info',
    resolved: 'success',
    closed: 'danger',
  };
  return map[status] || 'info';
}

// ==================== 图表配置 ====================

function buildTrendOption(
  xData: string[],
  userData: number[],
  recipeData: number[],
  seriesNames: string[] = ['用户增长', '食谱创建'],
  seriesColors: string[] = ['#f54e00', '#1f8a65']
) {
  const series = seriesNames.map((name, i) => {
    const color = seriesColors[i] || '#999';
    const data = i === 0 ? userData : recipeData;
    return {
      name,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { color, width: 3 },
      itemStyle: { color, borderColor: '#fff', borderWidth: 2 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: color + '26' },
          { offset: 1, color: color + '00' },
        ]),
      },
      data,
    };
  });

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: 'rgba(38, 37, 30, 0.1)',
      borderWidth: 1,
      textStyle: { color: '#26251e', fontFamily: 'system-ui' },
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(245, 78, 0, 0.05)' } },
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10px', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xData,
      axisLine: { lineStyle: { color: 'rgba(38, 37, 30, 0.1)' } },
      axisTick: { show: false },
      axisLabel: { color: 'rgba(38, 37, 30, 0.5)', fontFamily: 'system-ui', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(38, 37, 30, 0.06)', type: 'dashed' } },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: 'rgba(38, 37, 30, 0.5)', fontFamily: 'system-ui', fontSize: 11 },
    },
    series,
  };
}

function buildPieOption(categories: { name: string; value: number; itemStyle?: { color: string } }[]) {
  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: 'rgba(38, 37, 30, 0.1)',
      borderWidth: 1,
      textStyle: { color: '#26251e', fontFamily: 'system-ui' },
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 12,
      textStyle: { color: 'rgba(38, 37, 30, 0.7)', fontFamily: 'system-ui', fontSize: 12 },
    },
    series: [
      {
        type: 'pie',
        radius: ['50%', '75%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        label: { show: false },
        labelLine: { show: false },
        data: categories,
      },
    ],
  };
}

function initTrendChart() {
  if (!trendChartRef.value) return;
  trendChart = echarts.init(trendChartRef.value);
  trendChart.setOption(buildTrendOption([], [], []));
}

function initPieChart() {
  if (!pieChartRef.value) return;
  pieChart = echarts.init(pieChartRef.value);
  pieChart.setOption(buildPieOption([]));
}

// ==================== 数据获取 ====================

async function fetchStats() {
  isRefreshing.value = true;
  try {
    const [dashRes, catRes] = await Promise.all([
      analyticsApi.dashboard(),
      analyticsApi.getCategoryStats(),
    ]);
    const data = dashRes.data as any;
    const catData = catRes.data?.data ?? [];

    statCards.value = [
      { key: 'users', label: '用户总数', value: data?.totalUsers ?? 0, icon: User, color: '#f54e00', change: 0, period: '月' },
      { key: 'recipes', label: '菜谱总数', value: data?.totalRecipes ?? 0, icon: Food, color: '#1f8a65', change: 0, period: '月' },
      { key: 'collections', label: '收藏总量', value: data?.totalCollections ?? 0, icon: Collection, color: '#4a7dbf', change: 0, period: '月' },
      { key: 'feedbacks', label: '反馈总数', value: data?.totalFeedbacks ?? 0, icon: ChatDotRound, color: '#d4880e', change: 0, period: '月' },
    ];

    recentFeedbacks.value = data?.recentFeedbacks ?? [];

    if (data?.weeklyStats && trendChart) {
      const ws = data.weeklyStats;
      trendChart.setOption(buildTrendOption(
        ws.labels ?? [],
        ws.userTrend ?? [],
        ws.recipeTrend ?? [],
        ['用户增长', '食谱创建'],
        ['#f54e00', '#1f8a65']
      ), true);
    }

    if (catData.length && pieChart) {
      pieChart.setOption(buildPieOption(catData), true);
    }

    updateLastUpdated();
  } catch (error) {
    console.error('获取统计数据失败:', error);
  } finally {
    isRefreshing.value = false;
  }
}

function handleResize() {
  trendChart?.resize();
  pieChart?.resize();
}

onMounted(() => {
  initTrendChart();
  initPieChart();
  fetchStats();
  // 每 60 秒自动刷新一次
  refreshTimer = setInterval(fetchStats, 60_000);
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer);
  window.removeEventListener('resize', handleResize);
  trendChart?.dispose();
  pieChart?.dispose();
});
</script>

<style scoped lang="scss">
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 28px;

  .header-left {
    .page-title {
      font-family: var(--font-display);
      font-size: 24px;
      font-weight: 400;
      letter-spacing: -0.6px;
      color: var(--cursor-dark);
      margin-bottom: 4px;
    }
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;

    .last-updated {
      font-size: 12px;
      color: rgba(38, 37, 30, 0.45);
    }
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  background: var(--surface-200);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: 20px 24px;
  transition: all 0.25s ease;
  cursor: default;

  &:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-elevated);
    border-color: var(--border-medium);
  }

  .stat-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .stat-icon {
    width: 44px;
    height: 44px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(245, 78, 0, 0.08);
    color: var(--accent-color, var(--cursor-orange));

    .el-icon {
      font-size: 22px;
    }
  }

  .stat-trend {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: var(--radius-pill);
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 500;
    background: rgba(31, 138, 101, 0.1);
    color: var(--color-success);

    .el-icon {
      font-size: 12px;
    }

    &.negative {
      background: rgba(207, 45, 86, 0.1);
      color: var(--color-error);
    }
  }

  .stat-value {
    font-family: var(--font-display);
    font-size: 32px;
    font-weight: 400;
    letter-spacing: -1px;
    color: var(--cursor-dark);
    line-height: 1.1;
    margin-bottom: 4px;
  }

  .stat-label {
    font-family: var(--font-serif);
    font-size: 14px;
    color: rgba(38, 37, 30, 0.6);
    margin-bottom: 2px;
  }

  .stat-sublabel {
    font-family: var(--font-mono);
    font-size: 10px;
    color: rgba(38, 37, 30, 0.4);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.charts-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 24px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.chart-card {
  background: var(--surface-200);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: 20px 24px;
  box-shadow: var(--shadow-card);
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;

  .chart-title {
    font-family: var(--font-display);
    font-size: 16px;
    font-weight: 400;
    color: var(--cursor-dark);
  }

  .chart-legend {
    display: flex;
    gap: 16px;

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: var(--font-serif);
      font-size: 12px;
      color: rgba(38, 37, 30, 0.6);

      .legend-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }
    }
  }
}

.chart-container {
  height: 280px;
}

.chart-container-pie {
  height: 260px;
}

.bottom-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.data-table {
  .table-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    .table-title {
      font-family: var(--font-display);
      font-size: 16px;
      font-weight: 400;
      color: var(--cursor-dark);
    }
  }

  .feedback-content {
    font-family: var(--font-serif);
    font-size: 13px;
    color: rgba(38, 37, 30, 0.7);
  }
}

.quick-actions {
  .table-header {
    margin-bottom: 20px;

    .table-title {
      font-family: var(--font-display);
      font-size: 16px;
      font-weight: 400;
      color: var(--cursor-dark);
    }
  }
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.quick-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--surface-300);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--surface-400);
    border-color: var(--border-medium);
    transform: translateY(-2px);
  }

  .action-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;

    .el-icon {
      font-size: 20px;
    }
  }

  span {
    font-family: var(--font-display);
    font-size: 12px;
    color: rgba(38, 37, 30, 0.7);
  }
}
</style>
