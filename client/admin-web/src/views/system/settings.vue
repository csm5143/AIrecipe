<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">基础设置</h2>
        <p class="text-muted">配置系统基础信息</p>
      </div>
    </div>

    <div class="settings-layout">
      <div class="settings-nav">
        <div
          v-for="item in settingItems"
          :key="item.key"
          class="nav-item"
          :class="{ active: activeSetting === item.key }"
          @click="activeSetting = item.key"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </div>
      </div>

      <div class="settings-content">
        <!-- 网站信息 -->
        <div v-show="activeSetting === 'site'" class="settings-panel">
          <div class="panel-header">
            <h3>网站信息</h3>
            <p class="text-muted">配置网站的基本信息</p>
          </div>
          <div class="panel-body">
            <el-form :model="siteForm" label-position="top" style="max-width: 600px">
              <el-form-item label="网站名称" required>
                <el-input v-model="siteForm.siteName" placeholder="请输入网站名称" />
              </el-form-item>
              <el-form-item label="网站描述">
                <el-input
                  v-model="siteForm.siteDescription"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入网站描述"
                />
              </el-form-item>
              <el-form-item label="网站 Logo">
                <div class="image-upload-row">
                  <el-upload
                    ref="logoUploadRef"
                    class="image-uploader"
                    :class="{ 'has-preview': logoPreview }"
                    action="#"
                    :auto-upload="false"
                    :show-file-list="false"
                    accept="image/*"
                    @change="handleLogoChange"
                  >
                    <div v-if="logoUploading" class="upload-mask">
                      <el-icon class="is-loading"><Refresh /></el-icon>
                      <span>上传中...</span>
                    </div>
                    <img v-else-if="logoPreview" :src="logoPreview" class="image-preview" />
                    <div v-else class="upload-placeholder">
                      <el-icon class="upload-icon"><Plus /></el-icon>
                      <span>上传 Logo</span>
                    </div>
                  </el-upload>
                  <div class="upload-actions">
                    <el-button size="small" @click="logoUploadRef?.$el.querySelector('input').click()">
                      更换图片
                    </el-button>
                    <el-button v-if="logoPreview" size="small" type="danger" plain @click="removeLogo">
                      移除
                    </el-button>
                    <div class="upload-tip">建议尺寸 200x60，支持 PNG/JPG/SVG</div>
                  </div>
                </div>
              </el-form-item>
              <el-form-item label="网站图标（Favicon）">
                <div class="image-upload-row">
                  <el-upload
                    ref="faviconUploadRef"
                    class="image-uploader favicon-uploader"
                    :class="{ 'has-preview': faviconPreview }"
                    action="#"
                    :auto-upload="false"
                    :show-file-list="false"
                    accept="image/*"
                    @change="handleFaviconChange"
                  >
                    <div v-if="faviconUploading" class="upload-mask favicon-upload-mask">
                      <el-icon class="is-loading"><Refresh /></el-icon>
                    </div>
                    <img v-else-if="faviconPreview" :src="faviconPreview" class="image-preview favicon-preview" />
                    <div v-else class="upload-placeholder favicon-placeholder">
                      <el-icon class="upload-icon"><Plus /></el-icon>
                      <span>上传图标</span>
                    </div>
                  </el-upload>
                  <div class="upload-actions">
                    <el-button size="small" @click="faviconUploadRef?.$el.querySelector('input').click()">
                      更换图片
                    </el-button>
                    <el-button v-if="faviconPreview" size="small" type="danger" plain @click="removeFavicon">
                      移除
                    </el-button>
                    <div class="upload-tip">建议尺寸 32x32 或 64x64，支持 ICO/PNG</div>
                  </div>
                </div>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="saving.site" @click="handleSaveSite">保存设置</el-button>
                <el-button v-if="hasUnsavedSiteChanges" type="warning" plain @click="handleResetSite">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>

        <!-- SEO 设置 -->
        <div v-show="activeSetting === 'seo'" class="settings-panel">
          <div class="panel-header">
            <h3>SEO 设置</h3>
            <p class="text-muted">配置搜索引擎优化相关设置</p>
          </div>
          <div class="panel-body">
            <el-form :model="seoForm" label-position="top" style="max-width: 600px">
              <el-form-item label="SEO 标题">
                <el-input v-model="seoForm.title" placeholder="请输入 SEO 标题" />
              </el-form-item>
              <el-form-item label="SEO 关键字">
                <el-input v-model="seoForm.keywords" placeholder="请输入关键字，用逗号分隔" />
              </el-form-item>
              <el-form-item label="SEO 描述">
                <el-input
                  v-model="seoForm.description"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入 SEO 描述"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="saving.seo" @click="handleSaveSeo">保存设置</el-button>
                <el-button v-if="hasUnsavedSeoChanges" type="warning" plain @click="handleResetSeo">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>

        <!-- 备案信息 -->
        <div v-show="activeSetting === 'legal'" class="settings-panel">
          <div class="panel-header">
            <h3>备案信息</h3>
            <p class="text-muted">配置网站备案和版权信息</p>
          </div>
          <div class="panel-body">
            <el-form :model="legalForm" label-position="top" style="max-width: 600px">
              <el-form-item label="ICP 备案号">
                <el-input v-model="legalForm.icp" placeholder="如：京ICP备XXXXXXXX号-1" />
              </el-form-item>
              <el-form-item label="公安备案号">
                <el-input v-model="legalForm.psbe" placeholder="如：京公网安备XXXXXXXXXXXXXXXX号" />
              </el-form-item>
              <el-form-item label="版权信息">
                <el-input v-model="legalForm.copyright" placeholder="如：© 2024 AIRecipe 版权所有" />
              </el-form-item>
              <el-form-item label="公司名称">
                <el-input v-model="legalForm.company" placeholder="请输入公司名称" />
              </el-form-item>
              <el-form-item label="联系电话">
                <el-input v-model="legalForm.phone" placeholder="请输入联系电话" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="saving.legal" @click="handleSaveLegal">保存设置</el-button>
                <el-button v-if="hasUnsavedLegalChanges" type="warning" plain @click="handleResetLegal">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>

        <!-- 安全设置 -->
        <div v-show="activeSetting === 'security'" class="settings-panel">
          <div class="panel-header">
            <h3>安全设置</h3>
            <p class="text-muted">配置系统安全相关选项</p>
          </div>
          <div class="panel-body">
            <el-form :model="securityForm" label-position="top" style="max-width: 600px">
              <el-form-item label="会话超时时间">
                <el-select v-model="securityForm.sessionTimeout" style="width: 200px">
                  <el-option label="30 分钟" :value="30" />
                  <el-option label="1 小时" :value="60" />
                  <el-option label="2 小时" :value="120" />
                  <el-option label="6 小时" :value="360" />
                  <el-option label="12 小时" :value="720" />
                </el-select>
              </el-form-item>
              <el-form-item label="登录失败锁定">
                <el-input-number v-model="securityForm.maxLoginAttempts" :min="3" :max="10" />
                <span class="input-hint">次后锁定账户</span>
              </el-form-item>
              <el-form-item label="密码强度要求">
                <el-checkbox-group v-model="securityForm.passwordRequirements">
                  <el-checkbox label="minLength">最少 8 位</el-checkbox>
                  <el-checkbox label="uppercase">包含大写字母</el-checkbox>
                  <el-checkbox label="lowercase">包含小写字母</el-checkbox>
                  <el-checkbox label="number">包含数字</el-checkbox>
                  <el-checkbox label="special">包含特殊字符</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              <el-form-item label="操作日志">
                <el-switch v-model="securityForm.enableOperationLog" />
                <span class="input-hint">记录所有管理员操作</span>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="saving.security" @click="handleSaveSecurity">保存设置</el-button>
                <el-button v-if="hasUnsavedSecurityChanges" type="warning" plain @click="handleResetSecurity">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>

        <!-- 邮件设置 -->
        <div v-show="activeSetting === 'email'" class="settings-panel">
          <div class="panel-header">
            <h3>邮件设置</h3>
            <p class="text-muted">配置系统邮件发送服务</p>
          </div>
          <div class="panel-body">
            <el-form :model="emailForm" label-position="top" style="max-width: 600px">
              <el-form-item label="SMTP 服务器">
                <el-input v-model="emailForm.smtpHost" placeholder="如：smtp.example.com" />
              </el-form-item>
              <el-form-item label="SMTP 端口">
                <el-input-number v-model="emailForm.smtpPort" :min="1" :max="65535" />
              </el-form-item>
              <el-form-item label="加密方式">
                <el-radio-group v-model="emailForm.encryption">
                  <el-radio value="none">无</el-radio>
                  <el-radio value="ssl">SSL</el-radio>
                  <el-radio value="tls">TLS</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="发件人邮箱">
                <el-input v-model="emailForm.fromEmail" placeholder="请输入发件人邮箱" />
              </el-form-item>
              <el-form-item label="发件人名称">
                <el-input v-model="emailForm.fromName" placeholder="请输入发件人名称" />
              </el-form-item>
              <el-form-item label="邮箱账号">
                <el-input v-model="emailForm.username" placeholder="请输入邮箱账号" />
              </el-form-item>
              <el-form-item label="邮箱密码">
                <el-input v-model="emailForm.password" type="password" placeholder="请输入邮箱密码或授权码" show-password />
              </el-form-item>
              <el-form-item>
                <el-button @click="handleTestEmail">发送测试邮件</el-button>
                <el-button type="primary" :loading="saving.email" style="margin-left: 12px" @click="handleSaveEmail">保存设置</el-button>
                <el-button v-if="hasUnsavedEmailChanges" type="warning" plain @click="handleResetEmail">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>

        <!-- AI Key 管理 -->
        <div v-show="activeSetting === 'ai'" class="settings-panel">
          <div class="panel-header ai-panel-header">
            <div>
              <h3>AI Key 管理</h3>
              <p class="text-muted">管理 API Key，支持多 Key 切换，系统自动使用当前激活的 Key</p>
            </div>
            <el-button type="primary" :icon="Plus" @click="openAddDialog">添加 Key</el-button>
          </div>

          <!-- Key 卡片网格 -->
          <div v-if="aiKeys.length > 0" class="ai-key-grid">
            <div
              v-for="key in aiKeys"
              :key="key.id"
              class="ai-key-card"
              :class="{ 'is-active': key.isActive }"
            >
              <div class="key-card-header">
                <div class="key-name-row">
                  <span class="key-name">{{ key.name }}</span>
                  <el-tag v-if="key.isActive" type="success" size="small" effect="dark">使用中</el-tag>
                  <el-tag v-else type="info" size="small" effect="plain">未启用</el-tag>
                </div>
              </div>

              <div class="key-model">{{ key.model }} <el-tag v-if="key.keyType" size="small" :type="key.keyType==='image'?'warning':key.keyType==='text'?'primary':'success'">{{ keyTypeLabel(key.keyType) }}</el-tag></div>

              <div class="key-url">{{ key.baseUrl }}</div>

              <div class="key-progress">
                <el-progress
                  :percentage="key.totalTokens > 0 ? Math.min(100, Math.round((key.usedTokens / key.totalTokens) * 100)) : 0"
                  :stroke-width="6"
                  :color="getProgressColor(key)"
                />
              </div>

              <div class="key-stats">
                <div class="key-stat">
                  <span class="key-stat-label">已用</span>
                  <span class="key-stat-value used">{{ formatToken(key.usedTokens) }}</span>
                </div>
                <div class="key-stat">
                  <span class="key-stat-label">剩余</span>
                  <span class="key-stat-value remaining">{{ formatToken(key.remaining) }}</span>
                </div>
                <div class="key-stat">
                  <span class="key-stat-label">总量</span>
                  <span class="key-stat-value">{{ formatToken(key.totalTokens) }}</span>
                </div>
              </div>

              <div class="key-actions">
                <el-button
                  size="small"
                  :type="key.isActive ? 'warning' : 'primary'"
                  @click="handleActivate(key)"
                >
                  {{ key.isActive ? '停用' : '启用' }}
                </el-button>
                <el-button size="small" type="primary" @click="openEditDialog(key)">编辑</el-button>
                <el-button size="small" type="danger" plain @click="handleDelete(key)">删除</el-button>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-else class="ai-key-empty">
            <el-icon class="empty-icon"><Cpu /></el-icon>
            <p>暂无 AI Key</p>
            <p class="text-muted">点击上方按钮添加 API Key</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑 Key 弹窗 -->
    <el-dialog
      v-model="showDialog"
      :title="editingKey ? '编辑 AI Key' : '添加 AI Key'"
      width="560px"
      destroy-on-close
    >
      <!-- 识别粘贴 -->
      <div v-if="!editingKey" style="margin-bottom:12px">
        <el-button size="small" text type="primary" @click="smartPasteOpen=!smartPasteOpen">
          {{ smartPasteOpen ? '收起' : '📋 识别粘贴（从API中转站复制连接信息）' }}
        </el-button>
        <div v-if="smartPasteOpen" style="margin-top:8px;display:flex;flex-direction:column;gap:8px">
          <el-input
            v-model="smartPasteRaw"
            type="textarea"
            :rows="5"
            size="small"
            placeholder="粘贴从 API 中转站复制的连接信息，支持多种格式：
&#10;格式1（多行键值）：
API Key: sk-xxx
Base URL: https://xxx.com/v1
Model: gpt-4o-mini
&#10;格式2（紧凑）：sk-xxx@https://xxx.com/v1"
          />
          <div style="display:flex;gap:8px">
            <el-button size="small" type="primary" @click="doSmartPaste" :disabled="!smartPasteRaw.trim()">识别并填充</el-button>
            <el-button size="small" @click="smartPasteRaw='';smartPasteOpen=false">取消</el-button>
          </div>
        </div>
      </div>
      <el-form :model="keyForm" label-position="top" style="max-width: 100%">
        <el-form-item label="Key 名称" required>
          <el-input v-model="keyForm.name" placeholder="如：GPT-4o-mini 官方Key" />
        </el-form-item>
        <el-form-item label="API Key" required>
          <el-input
            v-model="keyForm.apiKey"
            type="password"
            placeholder="请输入 API Key"
            show-password
          />
        </el-form-item>
        <el-form-item label="Base URL" required>
          <el-input v-model="keyForm.baseUrl" placeholder="如：https://api.openai.com/v1" />
        </el-form-item>
        <el-form-item label="模型名称" required>
          <el-select
            v-model="keyForm.model"
            placeholder="请选择或输入模型名称"
            style="width: 100%"
            filterable
            allow-create
            default-first-option
          >
            <el-option label="gpt-4o-mini" value="gpt-4o-mini" />
            <el-option label="gpt-4o" value="gpt-4o" />
            <el-option label="gpt-4-turbo" value="gpt-4-turbo" />
            <el-option label="gpt-3.5-turbo" value="gpt-3.5-turbo" />
            <el-option label="doubao-pro-32k" value="doubao-pro-32k" />
            <el-option label="doubao-pro-128k" value="doubao-pro-128k" />
            <el-option label="doubao-vision-pro" value="doubao-vision-pro" />
            <el-option label="glm-4-flash" value="glm-4-flash" />
            <el-option label="glm-4-plus" value="glm-4-plus" />
            <el-option label="glm-4v-plus" value="glm-4v-plus" />
            <el-option label="qwen-vl-max" value="qwen-vl-max" />
            <el-option label="qwen-vl-plus" value="qwen-vl-plus" />
            <el-option label="custom..." value="" disabled style="display:none" />
          </el-select>
          <div class="input-hint">如未找到想要的模型，可直接输入自定义模型名称</div>
        </el-form-item>
        <el-form-item label="Key 类型" required>
          <el-select v-model="keyForm.keyType" placeholder="选择此 Key 的用途" style="width: 100%">
            <el-option label="生图（Image Generation）" value="image" />
            <el-option label="识图/文本（Text & Vision）" value="text" />
            <el-option label="多模态通用（Multimodal）" value="multimodal" />
          </el-select>
          <div class="input-hint">生图 Key 用于图片创作；识图/文本 Key 用于拍照识别和文案生成；多模态通用两者皆可。同类型内只能有一个激活。</div>
        </el-form-item>
        <el-form-item>
          <el-button
            :loading="testing"
            :type="testResult && testResult.success ? 'success' : testResult && !testResult.success ? 'danger' : 'default'"
            :icon="testResult && testResult.success ? 'CircleCheck' : testResult && !testResult.success ? 'CircleClose' : 'Connection'"
            @click="handleTestConnection"
            :disabled="!keyForm.apiKey || !keyForm.baseUrl || !keyForm.model"
          >
            {{ testing ? '测试中...' : testResult ? (testResult.success ? '连接成功' : '连接失败') : '测试连接' }}
          </el-button>
          <span v-if="testResult" class="test-result" :class="testResult.success ? 'test-success' : 'test-fail'">
            <template v-if="testResult.success">
              模型: {{ testResult.model }} · 响应: "{{ testResult.response }}" · {{ testResult.elapsed }}ms · {{ testResult.tokens }} tokens
            </template>
            <template v-else>
              {{ testResult.error }}
              <template v-if="testResult.elapsed"> · {{ testResult.elapsed }}ms</template>
            </template>
          </span>
        </el-form-item>
        <el-form-item label="总量 Token" required>
          <el-input-number v-model="keyForm.totalTokens" :min="1" :step="10000" style="width: 100%;" />
          <span class="input-hint">填入该 Key 的额度上限，用于计算剩余量</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="savingKey" @click="handleSaveKey">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { Setting, Link, Document, Lock, Message, Plus, Refresh, Cpu } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { systemApi, type SiteSettings, type SeoSettings, type LegalSettings, type SecuritySettings, type EmailSettings } from '@/api/system';
import { aiKeyApi, type AiKeyItem } from '@/api/ai-key';
import { uploadSettings } from '@/api/upload';
import { useSiteSettingsStore } from '@/store/modules/siteSettings';

const siteSettingsStore = useSiteSettingsStore();

const activeSetting = ref('site');
const logoUploadRef = ref();
const faviconUploadRef = ref();
const loading = ref(false);
const logoUploading = ref(false);
const faviconUploading = ref(false);

const logoPreview = ref('');
const faviconPreview = ref('');

const originalSiteForm = ref<SiteSettings>({ siteName: '', siteDescription: '', logo: '', favicon: '' });
const originalSeoForm = ref<SeoSettings>({ title: '', keywords: '', description: '' });
const originalLegalForm = ref<LegalSettings>({ icp: '', psbe: '', copyright: '', company: '', phone: '' });
const originalSecurityForm = ref<SecuritySettings>({ sessionTimeout: 60, maxLoginAttempts: 5, passwordRequirements: [], enableOperationLog: true });
const originalEmailForm = ref<EmailSettings>({ smtpHost: '', smtpPort: 465, encryption: 'ssl', fromEmail: '', fromName: '', username: '', password: '' });

const saving = reactive({
  site: false, seo: false, legal: false, security: false, email: false,
});

const siteForm = reactive<SiteSettings>({
  siteName: '',
  siteDescription: '',
  logo: '',
  favicon: '',
});

const seoForm = reactive<SeoSettings>({
  title: '',
  keywords: '',
  description: '',
});

const legalForm = reactive<LegalSettings>({
  icp: '',
  psbe: '',
  copyright: '',
  company: '',
  phone: '',
});

const securityForm = reactive<SecuritySettings>({
  sessionTimeout: 60,
  maxLoginAttempts: 5,
  passwordRequirements: ['minLength', 'number'],
  enableOperationLog: true,
});

const emailForm = reactive<EmailSettings>({
  smtpHost: '',
  smtpPort: 465,
  encryption: 'ssl',
  fromEmail: '',
  fromName: '',
  username: '',
  password: '',
});

// ==================== AI Key 管理 ====================

const aiKeys = ref<AiKeyItem[]>([]);
const showDialog = ref(false);
const editingKey = ref<AiKeyItem | null>(null);
const savingKey = ref(false);
const testing = ref(false);
const testResult = ref<{
  success: boolean;
  status?: number;
  error?: string;
  model?: string;
  response?: string;
  tokens?: number;
  elapsed?: number;
} | null>(null);

const keyForm = reactive({
  name: '',
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  keyType: '' as string,
  totalTokens: 1000000,
});

// 识别粘贴
const smartPasteOpen = ref(false);
const smartPasteRaw = ref('');

function doSmartPaste() {
  const raw = smartPasteRaw.value.trim();
  if (!raw) return;

  let apiKey = '';
  let baseUrl = '';
  let model = '';
  let name = '';
  let keyType = '';

  // ============ 格式0: JSON（API中转站/NewAPI/OneAPI 等） ============
  if (raw.startsWith('{')) {
    try {
      const json = JSON.parse(raw);
      // 提取 api key
      apiKey = json.key || json.api_key || json.apiKey || json.sk || '';

      // 提取 URL
      baseUrl = json.url || json.base_url || json.baseUrl || json.api || json.address || json.host || '';

      // 提取 model（可能是字符串或数组）
      const m = json.model || json.models || '';
      if (Array.isArray(m) && m.length) {
        model = m[0];
        // 如果数组有多项，优先选非 image 的作为默认
        const textModel = m.find((x: string) => !/image|dall-e|flux|stable|midjourney/i.test(x));
        if (textModel) model = textModel;
      } else if (typeof m === 'string') {
        model = m;
      }

      // 提取名称
      name = json.name || json.remark || json.description || json.nickname || '';
      if (json._type) name = name || json._type.replace(/_/g, ' ');

      // 提取 keyType
      const typeHint = json.type || json.keyType || json.mode || '';
      if (/image|生图/i.test(typeHint)) keyType = 'image';
      else if (/text|文本/i.test(typeHint)) keyType = 'text';
      else if (/multimodal|多模态|vision/i.test(typeHint)) keyType = 'multimodal';
    } catch (_) { /* 不是合法JSON, 继续尝试其他格式 */ }
  }

  // ============ 格式1: key@url 紧凑格式 ============
  if (!apiKey) {
    const compactMatch = raw.match(/(sk-[a-zA-Z0-9_-]{20,})\s*[@]\s*(https?:\/\/[^\s]+)/);
    if (compactMatch) {
      apiKey = compactMatch[1];
      baseUrl = compactMatch[2];
    }
  }

  // ============ 格式2: 多行键值对 ============
  if (!apiKey) {
    const lines = raw.split(/[\n\r]+/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || /^[=\-]{3,}$/.test(trimmed)) continue;

      let match = trimmed.match(/^[【\[]?\s*(?:API[-\s]?)?key[】\]\s]*[：:=]\s*(sk-[^\s]+)/i);
      if (match) apiKey = match[1];

      match = trimmed.match(/^[【\[]?\s*(?:API[-\s]?)?[Kk]ey[】\]\s]*[：:=]\s*(.+)/i);
      if (match && !apiKey) {
        const val = match[1].trim();
        if (val.startsWith('sk-') || val.length >= 20) apiKey = val;
      }

      match = trimmed.match(/^(?:Base[-\s]?)?\s*URL[：:=]\s*(https?:\/\/[^\s]+)/i);
      if (match) baseUrl = match[1];

      match = trimmed.match(/^(?:API[-\s]?)?\s*[Aa]ddress[：:=]\s*(https?:\/\/[^\s]+)/i);
      if (match && !baseUrl) baseUrl = match[1];

      match = trimmed.match(/^(?:Model|模型)[：:=]\s*(.+)/i);
      if (match) model = match[1].trim();

      match = trimmed.match(/^[Nn]ame[：:=]\s*(.+)/i);
      if (match) name = match[1].trim();
    }
  }

  // ============ 格式3: 无标签逐行解析 ============
  if (!apiKey && !baseUrl) {
    const lines = raw.split(/[\n\r]+/).map(l => l.trim()).filter(l => l && !/^[=\-]{3,}$/.test(l));
    for (const line of lines) {
      if (line.startsWith('sk-') && !apiKey) {
        apiKey = line;
      } else if (/^https?:\/\//.test(line) && !baseUrl) {
        baseUrl = line;
      } else if (!model && /^[a-zA-Z0-9][a-zA-Z0-9._-]{3,40}$/.test(line) && !line.startsWith('http')) {
        model = line;
      }
    }
  }

  if (!apiKey) {
    ElMessage.warning('未能识别 API Key，请检查粘贴内容');
    return;
  }

  // 自动推断 keyType
  if (!keyType) {
    const combined = (model + baseUrl).toLowerCase();
    if (/image|dall-e|flux|stable|midjourney|sdxl/i.test(combined)) {
      keyType = 'image';
    } else if (/vision|vl|多模态/i.test(combined)) {
      keyType = 'multimodal';
    }
  }

  // 自动生成名称
  if (!name && model) name = model;
  if (!name && apiKey) name = apiKey.slice(0, 8) + '...';

  // 填充表单
  keyForm.apiKey = apiKey;
  if (baseUrl) keyForm.baseUrl = baseUrl;
  if (model) keyForm.model = model;
  if (keyType) keyForm.keyType = keyType;
  if (name) keyForm.name = name;

  smartPasteOpen.value = false;
  smartPasteRaw.value = '';
  ElMessage.success(`已识别：${name || ''} ${model || ''} ${baseUrl ? '· ' + new URL(baseUrl).hostname : ''}`);
}

const settingItems = [
  { key: 'site', label: '网站信息', icon: Link },
  { key: 'seo', label: 'SEO 设置', icon: Document },
  { key: 'legal', label: '备案信息', icon: Setting },
  { key: 'security', label: '安全设置', icon: Lock },
  { key: 'email', label: '邮件设置', icon: Message },
  { key: 'ai', label: 'AI Key 管理', icon: Cpu },
];

const hasUnsavedSiteChanges = computed(() => JSON.stringify(siteForm) !== JSON.stringify(originalSiteForm.value));
const hasUnsavedSeoChanges = computed(() => JSON.stringify(seoForm) !== JSON.stringify(originalSeoForm.value));
const hasUnsavedLegalChanges = computed(() => JSON.stringify(legalForm) !== JSON.stringify(originalLegalForm.value));
const hasUnsavedSecurityChanges = computed(() => JSON.stringify(securityForm) !== JSON.stringify(originalSecurityForm.value));
const hasUnsavedEmailChanges = computed(() => JSON.stringify(emailForm) !== JSON.stringify(originalEmailForm.value));

async function loadSettings() {
  loading.value = true;
  try {
    const res = await systemApi.getSettings();
    const data = res.data as any;

    Object.assign(siteForm, data.site);
    originalSiteForm.value = { ...data.site };
    logoPreview.value = data.site.logo || '';
    faviconPreview.value = data.site.favicon || '';

    Object.assign(seoForm, data.seo);
    originalSeoForm.value = { ...data.seo };

    Object.assign(legalForm, data.legal);
    originalLegalForm.value = { ...data.legal };

    Object.assign(securityForm, data.security);
    originalSecurityForm.value = { ...data.security };

    Object.assign(emailForm, data.email);
    originalEmailForm.value = { ...data.email };
  } catch {
    ElMessage.error('加载设置失败');
  } finally {
    loading.value = false;
  }
}

async function loadAiKeys() {
  try {
    const res = await aiKeyApi.getList();
    aiKeys.value = res.data as AiKeyItem[];
  } catch {
    // ignore
  }
}

async function uploadAndSetLogo(file: File) {
  logoUploading.value = true;
  try {
    const result = await uploadSettings(file, 'logo');
    const url = (result as any).data?.url || (result as any).url;
    if (url) {
      siteForm.logo = url;
      logoPreview.value = url;
    }
  } catch {
    ElMessage.error('Logo 上传失败');
  } finally {
    logoUploading.value = false;
  }
}

async function uploadAndSetFavicon(file: File) {
  faviconUploading.value = true;
  try {
    const result = await uploadSettings(file, 'favicon');
    const url = (result as any).data?.url || (result as any).url;
    if (url) {
      siteForm.favicon = url;
      faviconPreview.value = url;
    }
  } catch {
    ElMessage.error('图标上传失败');
  } finally {
    faviconUploading.value = false;
  }
}

function handleLogoChange(file: any) {
  const raw = file.raw;
  if (!raw) return;
  logoPreview.value = URL.createObjectURL(raw);
  uploadAndSetLogo(raw);
}

function handleFaviconChange(file: any) {
  const raw = file.raw;
  if (!raw) return;
  faviconPreview.value = URL.createObjectURL(raw);
  uploadAndSetFavicon(raw);
}

function removeLogo() {
  siteForm.logo = '';
  logoPreview.value = '';
}

function removeFavicon() {
  siteForm.favicon = '';
  faviconPreview.value = '';
}

async function handleSaveSite() {
  saving.site = true;
  try {
    await systemApi.updateSettings('site', siteForm);
    Object.assign(originalSiteForm.value, siteForm);
    siteSettingsStore.updateSite({ ...siteForm });
    ElMessage.success('网站信息已保存');
  } catch {
    ElMessage.error('保存失败');
  } finally {
    saving.site = false;
  }
}

async function handleSaveSeo() {
  saving.seo = true;
  try {
    await systemApi.updateSettings('seo', seoForm);
    Object.assign(originalSeoForm.value, seoForm);
    ElMessage.success('SEO 设置已保存');
  } catch {
    ElMessage.error('保存失败');
  } finally {
    saving.seo = false;
  }
}

async function handleSaveLegal() {
  saving.legal = true;
  try {
    await systemApi.updateSettings('legal', legalForm);
    Object.assign(originalLegalForm.value, legalForm);
    ElMessage.success('备案信息已保存');
  } catch {
    ElMessage.error('保存失败');
  } finally {
    saving.legal = false;
  }
}

async function handleSaveSecurity() {
  saving.security = true;
  try {
    await systemApi.updateSettings('security', securityForm);
    Object.assign(originalSecurityForm.value, securityForm);
    ElMessage.success('安全设置已保存');
  } catch {
    ElMessage.error('保存失败');
  } finally {
    saving.security = false;
  }
}

async function handleSaveEmail() {
  saving.email = true;
  try {
    await systemApi.updateSettings('email', emailForm);
    Object.assign(originalEmailForm.value, emailForm);
    ElMessage.success('邮件设置已保存');
  } catch {
    ElMessage.error('保存失败');
  } finally {
    saving.email = false;
  }
}

function handleTestEmail() {
  ElMessage.info('测试邮件功能正在开发中');
}

function handleResetSite() {
  Object.assign(siteForm, originalSiteForm.value);
  logoPreview.value = originalSiteForm.value.logo || '';
  faviconPreview.value = originalSiteForm.value.favicon || '';
}

function handleResetSeo() {
  Object.assign(seoForm, originalSeoForm.value);
}

function handleResetLegal() {
  Object.assign(legalForm, originalLegalForm.value);
}

function handleResetSecurity() {
  Object.assign(securityForm, originalSecurityForm.value);
}

function handleResetEmail() {
  Object.assign(emailForm, originalEmailForm.value);
}

// ==================== AI Key 管理函数 ====================

function openAddDialog() {
  editingKey.value = null;
  keyForm.name = '';
  keyForm.apiKey = '';
  keyForm.baseUrl = 'https://api.openai.com/v1';
  keyForm.model = 'gpt-4o-mini';
  keyForm.keyType = '';
  keyForm.totalTokens = 1000000;
  testResult.value = null;
  showDialog.value = true;
}

function openEditDialog(key: AiKeyItem) {
  editingKey.value = key;
  keyForm.name = key.name;
  keyForm.apiKey = '';
  keyForm.baseUrl = key.baseUrl;
  keyForm.model = key.model;
  keyForm.keyType = key.keyType || '';
  keyForm.totalTokens = key.totalTokens;
  testResult.value = null;
  showDialog.value = true;
}

async function handleTestConnection() {
  if (!keyForm.apiKey || !keyForm.baseUrl || !keyForm.model) {
    ElMessage.warning('请先填写 API Key、Base URL 和模型名称');
    return;
  }
  testing.value = true;
  testResult.value = null;
  try {
    const res = await aiKeyApi.test({
      apiKey: keyForm.apiKey,
      baseUrl: keyForm.baseUrl,
      model: keyForm.model,
    });
    testResult.value = res.data as any;
  } catch (err: any) {
    testResult.value = {
      success: false,
      error: err?.message || '测试请求失败，请检查网络',
    };
  } finally {
    testing.value = false;
  }
}

async function handleSaveKey() {
  if (!keyForm.name || !keyForm.apiKey || !keyForm.baseUrl || !keyForm.model || !keyForm.totalTokens) {
    ElMessage.warning('请填写完整信息');
    return;
  }
  savingKey.value = true;
  try {
    if (editingKey.value) {
      await aiKeyApi.update(editingKey.value.id, {
        name: keyForm.name,
        apiKey: keyForm.apiKey || undefined,
        baseUrl: keyForm.baseUrl,
        model: keyForm.model,
        keyType: keyForm.keyType,
        totalTokens: keyForm.totalTokens,
      });
    } else {
      await aiKeyApi.create({
        name: keyForm.name,
        apiKey: keyForm.apiKey,
        baseUrl: keyForm.baseUrl,
        model: keyForm.model,
        keyType: keyForm.keyType || undefined,
        totalTokens: keyForm.totalTokens,
      });
    }
    showDialog.value = false;
    await loadAiKeys();
    ElMessage.success(editingKey.value ? 'AI Key 更新成功' : 'AI Key 添加成功');
  } catch {
    ElMessage.error('保存失败');
  } finally {
    savingKey.value = false;
  }
}

async function handleActivate(key: AiKeyItem) {
  try {
    await aiKeyApi.activate(key.id);
    await loadAiKeys();
    ElMessage.success(`已切换为「${key.name}」`);
  } catch {
    ElMessage.error('切换失败');
  }
}

async function handleDelete(key: AiKeyItem) {
  try {
    await ElMessageBox.confirm(`确定删除 AI Key「${key.name}」？`, '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await aiKeyApi.delete(key.id);
    await loadAiKeys();
    ElMessage.success('删除成功');
  } catch {
    // cancelled
  }
}

function getProgressColor(key: AiKeyItem): string {
  const pct = key.totalTokens > 0 ? (key.usedTokens / key.totalTokens) : 0;
  if (pct >= 0.9) return '#f85149';
  if (pct >= 0.7) return '#f0883e';
  return '#3fb950';
}

function keyTypeLabel(kt: string | null): string {
  if (kt === 'image') return '生图';
  if (kt === 'text') return '识图';
  if (kt === 'multimodal') return '多模态';
  return '';
}

function formatToken(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
}

onMounted(() => {
  loadSettings();
  loadAiKeys();
});
</script>

<style scoped lang="scss">
.settings-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 24px;
  align-items: start;
}

.settings-nav {
  background: var(--surface-200);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: 12px;
  position: sticky;
  top: 24px;

  .nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    border-radius: var(--radius-md);
    cursor: pointer;
    font-family: var(--font-display);
    font-size: 13px;
    color: rgba(38, 37, 30, 0.7);
    transition: all var(--transition-fast);

    .el-icon {
      font-size: 16px;
      color: rgba(38, 37, 30, 0.5);
      transition: color var(--transition-fast);
    }

    &:hover {
      background: var(--surface-300);
      color: var(--cursor-dark);
    }

    &.active {
      background: rgba(245, 78, 0, 0.08);
      color: var(--cursor-orange);

      .el-icon {
        color: var(--cursor-orange);
      }
    }
  }
}

.settings-content {
  min-height: 400px;
}

.settings-panel {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.panel-header {
  margin-bottom: 24px;

  h3 {
    font-family: var(--font-display);
    font-size: 18px;
    font-weight: 400;
    color: var(--cursor-dark);
    margin-bottom: 6px;
  }
}

.panel-body {
  background: var(--surface-200);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: 24px;
}

// ==================== AI Key 卡片网格 ====================

.ai-panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.ai-key-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.ai-key-card {
  background: var(--surface-200);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--border-medium);
    box-shadow: var(--shadow-card);
  }

  &.is-active {
    border-color: #3fb950;
    background: linear-gradient(135deg, rgba(63, 185, 80, 0.04) 0%, transparent 60%);
  }

  .key-card-header {
    .key-name-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .key-name {
      font-family: var(--font-display);
      font-size: 15px;
      font-weight: 500;
      color: var(--cursor-dark);
    }
  }

  .key-model {
    font-family: var(--font-mono);
    font-size: 12px;
    color: rgba(168, 85, 247, 0.9);
    background: rgba(168, 85, 247, 0.08);
    padding: 3px 8px;
    border-radius: 4px;
    display: inline-block;
  }

  .key-url {
    font-family: var(--font-mono);
    font-size: 10px;
    color: rgba(38, 37, 30, 0.4);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .key-progress {
    margin: 4px 0;
  }

  .key-stats {
    display: flex;
    justify-content: space-between;
    gap: 8px;

    .key-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;

      .key-stat-label {
        font-family: var(--font-mono);
        font-size: 10px;
        color: rgba(38, 37, 30, 0.45);
        margin-bottom: 2px;
      }

      .key-stat-value {
        font-family: var(--font-mono);
        font-size: 13px;
        font-weight: 600;
        color: var(--cursor-dark);

        &.used { color: rgba(38, 37, 30, 0.6); }
        &.remaining { color: #3fb950; }
      }
    }
  }

  .key-actions {
    display: flex;
    gap: 6px;
    margin-top: 4px;
    flex-wrap: wrap;
  }
}

.ai-key-empty {
  text-align: center;
  padding: 60px 20px;
  color: rgba(38, 37, 30, 0.5);
  background: var(--surface-200);
  border: 1px dashed var(--border-medium);
  border-radius: var(--radius-lg);

  .empty-icon {
    font-size: 48px;
    color: rgba(38, 37, 30, 0.2);
    margin-bottom: 12px;
  }

  p {
    font-family: var(--font-display);
    font-size: 16px;
    margin: 0;
  }

  p + p {
    font-size: 13px;
    margin-top: 6px;
  }
}

// ==================== 通用 ====================

.image-upload-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.image-uploader {
  :deep(.el-upload) {
    border: 2px dashed var(--border-medium);
    border-radius: var(--radius-md);
    cursor: pointer;
    overflow: hidden;
    transition: all var(--transition-fast);

    &:hover {
      border-color: var(--cursor-orange);
    }
  }

  &.has-preview {
    :deep(.el-upload) {
      border-style: solid;
      border-color: var(--border-medium);
    }
  }
}

.favicon-uploader {
  :deep(.el-upload) {
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.image-preview {
  width: 120px;
  height: 60px;
  object-fit: contain;
  display: block;
}

.favicon-preview {
  width: 64px;
  height: 64px;
  object-fit: contain;
}

.upload-placeholder {
  width: 120px;
  height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: var(--surface-300);
  color: rgba(38, 37, 30, 0.5);

  .upload-icon {
    font-size: 24px;
  }

  span {
    font-family: var(--font-display);
    font-size: 12px;
  }
}

.upload-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .upload-tip {
    font-family: var(--font-mono);
    font-size: 11px;
    color: rgba(38, 37, 30, 0.4);
  }
}

.upload-mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.85);
  border-radius: var(--radius-md);
  font-family: var(--font-display);
  font-size: 11px;
  color: var(--cursor-orange);
  z-index: 1;
}

.favicon-upload-mask {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-sm);
}

.favicon-placeholder {
  width: 64px;
  height: 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: var(--surface-300);
  border: 2px dashed var(--border-medium);
  border-radius: var(--radius-sm);
  color: rgba(38, 37, 30, 0.5);
}

.input-hint {
  margin-left: 12px;
  font-family: var(--font-serif);
  font-size: 13px;
  color: rgba(38, 37, 30, 0.5);
}

.test-result {
  margin-left: 12px;
  font-family: var(--font-mono);
  font-size: 12px;

  &.test-success {
    color: #3fb950;
  }

  &.test-fail {
    color: #f56c6c;
  }
}
</style>
