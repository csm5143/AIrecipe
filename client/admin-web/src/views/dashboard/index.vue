<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">数据看板</h2>
      <el-button :icon="Refresh" @click="fetchStats">刷新</el-button>
    </div>

    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :lg="6" v-for="stat in statCards" :key="stat.key">
        <div class="stat-card">
          <div class="stat-icon" :style="{ background: stat.bgColor }">
            <component :is="stat.icon" :style="{ color: stat.color }" />
          </div>
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="16">
        <div class="card-container">
          <div class="card-title">数据趋势</div>
          <div ref="chartRef" style="height: 300px"></div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="card-container">
          <div class="card-title">最新反馈</div>
          <el-table :data="recentFeedbacks" size="small">
            <el-table-column prop="content" label="内容" :show-overflow-tooltip="true" />
            <el-table-column prop="status" label="状态" width="80" />
            <el-table-column prop="createdAt" label="时间" width="100" />
          </el-table>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { User, Food, Collection, ChatDotRound, Refresh } from '@element-plus/icons-vue';
import * as echarts from 'echarts';

const chartRef = ref<HTMLElement>();
const recentFeedbacks = ref<any[]>([]);

const statCards = ref([
  { key: 'users', label: '用户总数', value: 0, icon: User, color: '#409eff', bgColor: '#ecf5ff' },
  { key: 'recipes', label: '食谱总数', value: 0, icon: Food, color: '#67c23a', bgColor: '#f0f9eb' },
  { key: 'collections', label: '收藏总数', value: 0, icon: Collection, color: '#e6a23c', bgColor: '#fdf6ec' },
  { key: 'feedbacks', label: '反馈总数', value: 0, icon: ChatDotRound, color: '#f56c6c', bgColor: '#fef0f0' },
]);

async function fetchStats() {
  // TODO: 调用统计接口
}

onMounted(() => {
  // TODO: 初始化图表
});
</script>

<style scoped lang="scss">
.stats-row {
  margin-bottom: 20px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #303133;
}
</style>
