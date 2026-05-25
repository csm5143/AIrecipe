<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="`导出${name}`"
    width="480px"
    :close-on-click-modal="false"
  >
    <div class="export-dialog-body">
      <p class="export-tip">
        共 <strong>{{ total }}</strong> 条{{ name }}数据，将按照当前筛选条件导出
      </p>
      <div class="export-format-list">
        <label
          class="export-format-item"
          :class="{ active: format === 'xlsx' }"
          @click="format = 'xlsx'"
        >
          <input type="radio" name="exportFormat" value="xlsx" hidden />
          <div class="format-icon xlsx-icon">
            <span>Excel</span>
          </div>
          <div class="format-info">
            <span class="format-name">Excel 格式</span>
            <span class="format-ext">.xlsx</span>
            <span class="format-desc">支持公式、筛选，适合数据分析</span>
          </div>
          <div class="format-check" v-if="format === 'xlsx'">
            <el-icon><Check /></el-icon>
          </div>
        </label>

        <label
          class="export-format-item"
          :class="{ active: format === 'csv' }"
          @click="format = 'csv'"
        >
          <input type="radio" name="exportFormat" value="csv" hidden />
          <div class="format-icon csv-icon">
            <span>CSV</span>
          </div>
          <div class="format-info">
            <span class="format-name">CSV 格式</span>
            <span class="format-ext">.csv</span>
            <span class="format-desc">体积更小，兼容所有编辑器</span>
          </div>
          <div class="format-check" v-if="format === 'csv'">
            <el-icon><Check /></el-icon>
          </div>
        </label>

        <label
          class="export-format-item"
          :class="{ active: format === 'json' }"
          @click="format = 'json'"
        >
          <input type="radio" name="exportFormat" value="json" hidden />
          <div class="format-icon json-icon">
            <span>JSON</span>
          </div>
          <div class="format-info">
            <span class="format-name">JSON 数据</span>
            <span class="format-ext">.json</span>
            <span class="format-desc">保留完整结构，适合程序导入</span>
          </div>
          <div class="format-check" v-if="format === 'json'">
            <el-icon><Check /></el-icon>
          </div>
        </label>
      </div>
    </div>
    <template #footer>
      <el-button @click="$emit('update:modelValue', false)" :disabled="exporting">取消</el-button>
      <el-button type="primary" :loading="exporting" @click="$emit('confirm', format)">
        确认导出
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Check } from '@element-plus/icons-vue';
import type { ExportFormat } from '@/composables/useExport';

defineProps<{
  modelValue: boolean;
  name: string;
  total: number;
  exporting: boolean;
}>();

defineEmits<{
  'update:modelValue': [value: boolean];
  confirm: [format: ExportFormat];
}>();

const format = ref<ExportFormat>('xlsx');
</script>

<style scoped lang="scss">
.export-dialog-body {
  padding: 8px 4px;
}

.export-tip {
  color: rgba(38, 37, 30, 0.6);
  font-size: 13px;
  margin-bottom: 20px;

  strong {
    color: var(--cursor-orange);
    font-weight: 600;
  }
}

.export-format-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.export-format-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border: 1.5px solid var(--border-primary);
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  user-select: none;

  &:hover {
    border-color: var(--cursor-orange);
    background: rgba(245, 111, 32, 0.04);
  }

  &.active {
    border-color: var(--cursor-orange);
    background: rgba(245, 111, 32, 0.06);

    .format-icon {
      opacity: 1;
    }
  }
}

.format-icon {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
  opacity: 0.7;
  transition: opacity 0.2s;
  color: #fff;

  &.xlsx-icon { background: #1d7a3d; }
  &.csv-icon { background: #3a6e38; }
  &.json-icon { background: #c47f17; }
}

.format-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.format-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--cursor-dark);
  font-family: var(--font-display);
}

.format-ext {
  font-size: 11px;
  color: rgba(38, 37, 30, 0.4);
  font-family: monospace;
}

.format-desc {
  font-size: 12px;
  color: rgba(38, 37, 30, 0.5);
  margin-top: 2px;
}

.format-check {
  color: var(--cursor-orange);
  font-size: 18px;
  flex-shrink: 0;
}
</style>
