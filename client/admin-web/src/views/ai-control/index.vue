<template>
  <div class="ai-control-page">
    <div class="page-header">
      <div>
        <h2>AI控制台</h2>
        <p>管理小厨子 AI 的全局参数、调用配额、技能开关、用户记忆和提醒任务。</p>
      </div>
      <el-button :icon="Refresh" :loading="loading" @click="loadAll">刷新</el-button>
    </div>

    <div class="summary-grid">
      <div v-for="item in metricCards" :key="item.label" class="summary-card">
        <div class="metric-icon" :class="item.tone">
          <el-icon><component :is="item.icon" /></el-icon>
        </div>
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
        <small>{{ item.sub }}</small>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="control-tabs">
      <el-tab-pane label="全局设置" name="settings">
        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>模型与配额</h3>
              <p>这些配置会影响小程序端的小厨子对话。保存操作仅超级管理员可用。</p>
            </div>
            <el-button v-if="isSuperAdmin" type="primary" :loading="savingSettings" @click="saveSettings">
              保存设置
            </el-button>
          </div>

          <el-form label-position="top" class="settings-form">
            <el-form-item label="系统提示词">
              <el-input
                v-model="settingsForm.ai.systemPrompt"
                type="textarea"
                :rows="5"
                placeholder="定义小厨子的语气、边界和输出策略"
                :disabled="!isSuperAdmin"
              />
            </el-form-item>
            <div class="form-grid">
              <el-form-item label="温度">
                <el-input-number v-model="settingsForm.ai.temperature" :min="0" :max="2" :step="0.1" :disabled="!isSuperAdmin" />
              </el-form-item>
              <el-form-item label="最大 Token">
                <el-input-number v-model="settingsForm.ai.maxTokens" :min="256" :max="16000" :step="256" :disabled="!isSuperAdmin" />
              </el-form-item>
              <el-form-item label="上下文轮数">
                <el-input-number v-model="settingsForm.ai.contextMessages" :min="2" :max="30" :disabled="!isSuperAdmin" />
              </el-form-item>
              <el-form-item label="RAG 命中数">
                <el-input-number v-model="settingsForm.ai.ragTopK" :min="0" :max="10" :disabled="!isSuperAdmin" />
              </el-form-item>
              <el-form-item label="记忆命中数">
                <el-input-number v-model="settingsForm.ai.memoryTopK" :min="0" :max="10" :disabled="!isSuperAdmin" />
              </el-form-item>
              <el-form-item label="单用户每日调用">
                <el-input-number v-model="settingsForm.quota.dailyLimit" :min="0" :max="10000" :disabled="!isSuperAdmin" />
              </el-form-item>
              <el-form-item label="单用户每日 Token">
                <el-input-number v-model="settingsForm.quota.dailyTokenLimit" :min="0" :max="10000000" :step="1000" :disabled="!isSuperAdmin" />
              </el-form-item>
            </div>
            <el-form-item label="配额白名单用户 ID">
              <el-input
                v-model="whitelistText"
                placeholder="多个用户 ID 用英文逗号分隔，例如 1,2,8"
                :disabled="!isSuperAdmin"
              />
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <el-tab-pane label="技能管理" name="skills">
        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>AI 技能</h3>
              <p>技能决定小厨子是否能调用菜谱搜索、购物清单和提醒等工具。</p>
            </div>
            <el-button v-if="isSuperAdmin" type="primary" :icon="Plus" @click="openSkillDialog()">新增技能</el-button>
          </div>

          <el-table v-loading="skillsLoading" :data="skills" class="control-table">
            <el-table-column label="技能" min-width="180">
              <template #default="{ row }">
                <div class="name-cell">
                  <strong>{{ row.displayName }}</strong>
                  <span>{{ row.name }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="说明" min-width="220" show-overflow-tooltip />
            <el-table-column label="触发词" min-width="180">
              <template #default="{ row }">
                <div class="tag-list">
                  <el-tag v-for="tag in row.triggerKeywords" :key="tag" size="small" effect="plain">{{ tag }}</el-tag>
                  <span v-if="!row.triggerKeywords?.length" class="muted">-</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="工具" min-width="170">
              <template #default="{ row }">
                <div class="tag-list">
                  <el-tag v-for="tool in row.tools" :key="tool" size="small" type="success" effect="plain">{{ tool }}</el-tag>
                  <span v-if="!row.tools?.length" class="muted">-</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="priority" label="优先级" width="90" />
            <el-table-column label="状态" width="110">
              <template #default="{ row }">
                <el-switch
                  v-model="row.isActive"
                  :disabled="!isSuperAdmin"
                  active-text="启用"
                  inactive-text="停用"
                  inline-prompt
                  @change="(value) => handleSkillToggle(row, Boolean(value))"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="130" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="openSkillDialog(row)">编辑</el-button>
                <el-button v-if="isSuperAdmin" link type="danger" @click="deleteSkill(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="用户记忆" name="memories">
        <div class="panel">
          <div class="filter-bar">
            <el-input v-model="memoryFilters.userId" clearable placeholder="用户ID" />
            <el-select v-model="memoryFilters.type" clearable placeholder="记忆类型">
              <el-option label="偏好" value="preference" />
              <el-option label="健康" value="health" />
              <el-option label="上下文" value="context" />
            </el-select>
            <el-button type="primary" :icon="Search" @click="searchMemories">查询</el-button>
            <el-button @click="resetMemories">重置</el-button>
            <el-button v-if="isSuperAdmin" type="warning" plain @click="clearUserMemories">清空用户记忆</el-button>
          </div>

          <el-table v-loading="memoriesLoading" :data="memories" class="control-table">
            <el-table-column label="用户" width="150">
              <template #default="{ row }">{{ userName(row.user, row.userId) }}</template>
            </el-table-column>
            <el-table-column label="类型" width="110">
              <template #default="{ row }">
                <el-tag effect="plain">{{ memoryTypeText(row.type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="content" label="记忆内容" min-width="300" show-overflow-tooltip />
            <el-table-column label="最近使用" width="170">
              <template #default="{ row }">{{ formatDate(row.lastUsedAt) }}</template>
            </el-table-column>
            <el-table-column label="创建时间" width="170">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column v-if="isSuperAdmin" label="操作" width="90" fixed="right">
              <template #default="{ row }">
                <el-button link type="danger" @click="deleteMemory(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrap">
            <el-pagination
              v-model:current-page="memoryPagination.page"
              v-model:page-size="memoryPagination.pageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="memoryPagination.total"
              @size-change="loadMemories"
              @current-change="loadMemories"
            />
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="提醒任务" name="tasks">
        <div class="panel">
          <div class="filter-bar">
            <el-input v-model="taskFilters.userId" clearable placeholder="用户ID" />
            <el-select v-model="taskFilters.fired" clearable placeholder="触发状态">
              <el-option label="待触发" value="false" />
              <el-option label="已触发" value="true" />
            </el-select>
            <el-button type="primary" :icon="Search" @click="searchTasks">查询</el-button>
            <el-button @click="resetTasks">重置</el-button>
          </div>

          <el-table v-loading="tasksLoading" :data="tasks" class="control-table">
            <el-table-column label="用户" width="150">
              <template #default="{ row }">{{ userName(row.user, row.userId) }}</template>
            </el-table-column>
            <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
            <el-table-column prop="body" label="内容" min-width="260" show-overflow-tooltip />
            <el-table-column label="类型" width="110">
              <template #default="{ row }">{{ taskTypeText(row.type) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.fired ? 'info' : 'warning'">{{ row.fired ? '已触发' : '待触发' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="触发时间" width="170">
              <template #default="{ row }">{{ formatDate(row.triggerAt) }}</template>
            </el-table-column>
            <el-table-column v-if="isSuperAdmin" label="操作" width="90" fixed="right">
              <template #default="{ row }">
                <el-button link type="danger" @click="deleteTask(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrap">
            <el-pagination
              v-model:current-page="taskPagination.page"
              v-model:page-size="taskPagination.pageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="taskPagination.total"
              @size-change="loadTasks"
              @current-change="loadTasks"
            />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="skillDialogVisible" :title="editingSkillId ? '编辑技能' : '新增技能'" width="720px">
      <el-form label-position="top" class="skill-form">
        <div class="form-grid">
          <el-form-item label="技能标识">
            <el-input v-model="skillForm.name" placeholder="例如 recipe-search" :disabled="Boolean(editingSkillId)" />
          </el-form-item>
          <el-form-item label="技能名称">
            <el-input v-model="skillForm.displayName" placeholder="例如 菜谱搜索" />
          </el-form-item>
          <el-form-item label="优先级">
            <el-input-number v-model="skillForm.priority" :min="0" :max="100" />
          </el-form-item>
          <el-form-item label="启用状态">
            <el-switch v-model="skillForm.isActive" active-text="启用" inactive-text="停用" />
          </el-form-item>
        </div>
        <el-form-item label="说明">
          <el-input v-model="skillForm.description" placeholder="技能用途说明" />
        </el-form-item>
        <el-form-item label="触发词">
          <el-input v-model="skillForm.triggerKeywordsText" placeholder="多个触发词用英文逗号分隔" />
        </el-form-item>
        <el-form-item label="工具">
          <el-input v-model="skillForm.toolsText" placeholder="例如 search_recipe, add_to_shopping_list" />
        </el-form-item>
        <el-form-item label="技能提示词">
          <el-input v-model="skillForm.systemPrompt" type="textarea" :rows="4" placeholder="补充该技能被触发时的行为约束" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="skillDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingSkill" @click="saveSkill">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Bell, Coin, Connection, Cpu, Plus, Refresh, Search, Setting, Stopwatch } from '@element-plus/icons-vue';
import { aiControlApi, type AiControlSettings, type AiSkill, type AiUserBrief, type ScheduledTask, type UserMemory } from '@/api/ai-control';
import { usePermission } from '@/composables/usePermission';

const { isSuperAdmin } = usePermission();

const activeTab = ref('settings');
const loading = ref(false);
const savingSettings = ref(false);
const skillsLoading = ref(false);
const memoriesLoading = ref(false);
const tasksLoading = ref(false);
const savingSkill = ref(false);

const dashboard = reactive({
  todayCalls: 0,
  todayTokens: 0,
  todayCost: 0,
  successRate: 1,
  averageDuration: 0,
  activeSessions: 0,
  activeSkills: 0,
  pendingTasks: 0,
});

const settingsForm = reactive<AiControlSettings>({
  ai: {
    systemPrompt: '',
    temperature: 0.7,
    maxTokens: 2000,
    contextMessages: 12,
    ragTopK: 4,
    memoryTopK: 4,
  },
  quota: {
    dailyLimit: 50,
    dailyTokenLimit: 50000,
    whitelist: [],
  },
});

const whitelistText = ref('');
const skills = ref<AiSkill[]>([]);
const memories = ref<UserMemory[]>([]);
const tasks = ref<ScheduledTask[]>([]);

const metricCards = computed(() => [
  { label: '今日调用', value: formatNumber(dashboard.todayCalls), sub: '小厨子对话调用', icon: Cpu, tone: 'blue' },
  { label: '今日 Token', value: formatNumber(dashboard.todayTokens), sub: '输入与输出合计', icon: Setting, tone: 'green' },
  { label: '今日成本', value: formatCost(dashboard.todayCost), sub: '按 Key 单价估算', icon: Coin, tone: 'orange' },
  { label: '成功率', value: `${Math.round(dashboard.successRate * 100)}%`, sub: '今日成功调用占比', icon: Connection, tone: 'purple' },
  { label: '平均耗时', value: dashboard.averageDuration ? `${dashboard.averageDuration}ms` : '-', sub: '成功调用平均耗时', icon: Stopwatch, tone: 'cyan' },
  { label: '待触发提醒', value: formatNumber(dashboard.pendingTasks), sub: `活跃技能 ${dashboard.activeSkills} 个`, icon: Bell, tone: 'red' },
]);

const skillDialogVisible = ref(false);
const editingSkillId = ref<number | null>(null);
const skillForm = reactive({
  name: '',
  displayName: '',
  description: '',
  triggerKeywordsText: '',
  toolsText: '',
  systemPrompt: '',
  priority: 0,
  isActive: true,
});

const memoryFilters = reactive({
  userId: '',
  type: '',
});
const memoryPagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
});

const taskFilters = reactive({
  userId: '',
  fired: '',
});
const taskPagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
});

onMounted(() => {
  loadAll();
});

async function loadAll() {
  loading.value = true;
  try {
    await Promise.all([loadDashboard(), loadSettings(), loadSkills(), loadMemories(), loadTasks()]);
  } finally {
    loading.value = false;
  }
}

async function loadDashboard() {
  const res: any = await aiControlApi.dashboard();
  Object.assign(dashboard, res.data || {});
}

async function loadSettings() {
  const res: any = await aiControlApi.getSettings();
  const data = res.data || {};
  Object.assign(settingsForm.ai, data.ai || {});
  Object.assign(settingsForm.quota, data.quota || {});
  whitelistText.value = (settingsForm.quota.whitelist || []).join(',');
}

async function saveSettings() {
  savingSettings.value = true;
  try {
    const whitelist = whitelistText.value
      .split(',')
      .map((item) => Number(item.trim()))
      .filter((item) => Number.isFinite(item) && item > 0);
    await aiControlApi.saveSettings({
      ai: { ...settingsForm.ai },
      quota: { ...settingsForm.quota, whitelist },
    });
    settingsForm.quota.whitelist = whitelist;
    ElMessage.success('设置已保存');
    await loadSettings();
  } finally {
    savingSettings.value = false;
  }
}

async function loadSkills() {
  skillsLoading.value = true;
  try {
    const res: any = await aiControlApi.getSkills();
    skills.value = res.data || [];
  } finally {
    skillsLoading.value = false;
  }
}

function openSkillDialog(row?: AiSkill | any) {
  editingSkillId.value = row?.id || null;
  skillForm.name = row?.name || '';
  skillForm.displayName = row?.displayName || '';
  skillForm.description = row?.description || '';
  skillForm.triggerKeywordsText = joinList(row?.triggerKeywords || []);
  skillForm.toolsText = joinList(row?.tools || []);
  skillForm.systemPrompt = row?.systemPrompt || '';
  skillForm.priority = row?.priority || 0;
  skillForm.isActive = row?.isActive ?? true;
  skillDialogVisible.value = true;
}

async function saveSkill() {
  if (!skillForm.name.trim() || !skillForm.displayName.trim()) {
    ElMessage.warning('请填写技能标识和技能名称');
    return;
  }
  savingSkill.value = true;
  try {
    const payload = {
      name: skillForm.name.trim(),
      displayName: skillForm.displayName.trim(),
      description: skillForm.description.trim(),
      triggerKeywords: splitList(skillForm.triggerKeywordsText),
      tools: splitList(skillForm.toolsText),
      systemPrompt: skillForm.systemPrompt.trim(),
      priority: skillForm.priority,
      isActive: skillForm.isActive,
    };
    if (editingSkillId.value) {
      await aiControlApi.updateSkill(editingSkillId.value, payload);
      ElMessage.success('技能已保存');
    } else {
      await aiControlApi.createSkill(payload);
      ElMessage.success('技能已创建');
    }
    skillDialogVisible.value = false;
    await Promise.all([loadSkills(), loadDashboard()]);
  } finally {
    savingSkill.value = false;
  }
}

async function handleSkillToggle(row: AiSkill | any, isActive: boolean) {
  try {
    await aiControlApi.toggleSkill(row.id, isActive);
    ElMessage.success(isActive ? '技能已启用' : '技能已停用');
    await loadDashboard();
  } catch (error) {
    row.isActive = !isActive;
    throw error;
  }
}

async function deleteSkill(row: AiSkill | any) {
  await ElMessageBox.confirm(`确认删除技能「${row.displayName}」吗？`, '删除确认', { type: 'warning' });
  await aiControlApi.deleteSkill(row.id);
  ElMessage.success('技能已删除');
  await Promise.all([loadSkills(), loadDashboard()]);
}

async function loadMemories() {
  memoriesLoading.value = true;
  try {
    const res: any = await aiControlApi.getMemories({
      page: memoryPagination.page,
      pageSize: memoryPagination.pageSize,
      userId: memoryFilters.userId || undefined,
      type: memoryFilters.type || undefined,
    });
    memories.value = res.data?.list || [];
    memoryPagination.total = res.data?.total || 0;
  } finally {
    memoriesLoading.value = false;
  }
}

function searchMemories() {
  memoryPagination.page = 1;
  loadMemories();
}

function resetMemories() {
  memoryFilters.userId = '';
  memoryFilters.type = '';
  searchMemories();
}

async function deleteMemory(row: UserMemory | any) {
  await ElMessageBox.confirm('确认删除这条用户记忆吗？', '删除确认', { type: 'warning' });
  await aiControlApi.deleteMemory(row.id);
  ElMessage.success('记忆已删除');
  await loadMemories();
}

async function clearUserMemories() {
  const userId = Number(memoryFilters.userId);
  if (!Number.isFinite(userId) || userId <= 0) {
    ElMessage.warning('请先输入要清空的用户ID');
    return;
  }
  await ElMessageBox.confirm(`确认清空用户 ${userId} 的全部记忆吗？`, '清空确认', { type: 'warning' });
  await aiControlApi.clearUserMemories(userId);
  ElMessage.success('用户记忆已清空');
  await loadMemories();
}

async function loadTasks() {
  tasksLoading.value = true;
  try {
    const res: any = await aiControlApi.getScheduledTasks({
      page: taskPagination.page,
      pageSize: taskPagination.pageSize,
      userId: taskFilters.userId || undefined,
      fired: taskFilters.fired || undefined,
    });
    tasks.value = res.data?.list || [];
    taskPagination.total = res.data?.total || 0;
  } finally {
    tasksLoading.value = false;
  }
}

function searchTasks() {
  taskPagination.page = 1;
  loadTasks();
}

function resetTasks() {
  taskFilters.userId = '';
  taskFilters.fired = '';
  searchTasks();
}

async function deleteTask(row: ScheduledTask | any) {
  await ElMessageBox.confirm(`确认删除提醒「${row.title}」吗？`, '删除确认', { type: 'warning' });
  await aiControlApi.deleteScheduledTask(row.id);
  ElMessage.success('提醒任务已删除');
  await Promise.all([loadTasks(), loadDashboard()]);
}

function splitList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinList(value: string[]) {
  return value.join(', ');
}

function userName(user: AiUserBrief | undefined, fallbackId: number) {
  return user?.nickname || user?.phone || user?.email || `用户${fallbackId}`;
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('zh-CN', { hour12: false });
}

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString('zh-CN');
}

function formatCost(value: number) {
  return `¥${Number(value || 0).toFixed(4)}`;
}

function memoryTypeText(type: string) {
  const map: Record<string, string> = {
    preference: '偏好',
    health: '健康',
    context: '上下文',
  };
  return map[type] || type;
}

function taskTypeText(type: string) {
  const map: Record<string, string> = {
    reminder: '提醒',
  };
  return map[type] || type;
}
</script>

<style scoped lang="scss">
.ai-control-page {
  padding: 24px;
  background: var(--surface-100);
  min-height: 100%;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;

  h2 {
    margin: 0 0 6px;
    font-size: 24px;
    color: var(--text-primary);
  }

  p {
    margin: 0;
    color: var(--text-secondary);
  }
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.summary-card {
  display: grid;
  grid-template-columns: 40px 1fr;
  gap: 4px 12px;
  align-items: center;
  padding: 16px;
  background: var(--surface-200);
  border: 1px solid var(--border-primary);
  border-radius: 8px;

  span,
  small {
    color: var(--text-secondary);
  }

  strong {
    font-size: 22px;
    color: var(--text-primary);
    line-height: 1.2;
  }

  small {
    grid-column: 2;
  }
}

.metric-icon {
  grid-row: span 3;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 8px;

  &.blue { color: #2563eb; background: #eff6ff; }
  &.green { color: #059669; background: #ecfdf5; }
  &.orange { color: #d97706; background: #fff7ed; }
  &.purple { color: #7c3aed; background: #f5f3ff; }
  &.cyan { color: #0891b2; background: #ecfeff; }
  &.red { color: #dc2626; background: #fef2f2; }
}

.control-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 14px;
  }
}

.panel {
  background: var(--surface-200);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  padding: 18px;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;

  h3 {
    margin: 0 0 6px;
    font-size: 18px;
    color: var(--text-primary);
  }

  p {
    margin: 0;
    color: var(--text-secondary);
  }
}

.settings-form,
.skill-form {
  max-width: 960px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0 16px;
}

.filter-bar {
  display: grid;
  grid-template-columns: minmax(160px, 220px) minmax(160px, 220px) auto auto auto;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.control-table {
  width: 100%;
}

.name-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;

  span {
    color: var(--text-secondary);
    font-size: 12px;
  }
}

.tag-list {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.muted {
  color: var(--text-tertiary);
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
}

@media (max-width: 900px) {
  .ai-control-page {
    padding: 16px;
  }

  .page-header,
  .panel-header {
    flex-direction: column;
  }

  .filter-bar {
    grid-template-columns: 1fr;
  }
}
</style>
