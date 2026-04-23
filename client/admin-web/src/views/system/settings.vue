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
                    <img v-if="logoPreview" :src="logoPreview" class="image-preview" />
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
                    <img v-if="faviconPreview" :src="faviconPreview" class="image-preview favicon-preview" />
                    <div v-else class="upload-placeholder">
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { Setting, Link, Document, Lock, Message, Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { systemApi, type SiteSettings, type SeoSettings, type LegalSettings, type SecuritySettings, type EmailSettings } from '@/api/system';
import { useSiteSettingsStore } from '@/store/modules/siteSettings';

const siteSettingsStore = useSiteSettingsStore();

const activeSetting = ref('site');
const logoUploadRef = ref();
const faviconUploadRef = ref();
const loading = ref(false);

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

const settingItems = [
  { key: 'site', label: '网站信息', icon: Link },
  { key: 'seo', label: 'SEO 设置', icon: Document },
  { key: 'legal', label: '备案信息', icon: Setting },
  { key: 'security', label: '安全设置', icon: Lock },
  { key: 'email', label: '邮件设置', icon: Message },
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
    const resp = res.data as any;
    const data = resp.data;

    Object.assign(siteForm, data.site);
    originalSiteForm.value = { ...data.site };
    logoPreview.value = data.site.logo ? getFullImageUrl(data.site.logo) : '';
    faviconPreview.value = data.site.favicon ? getFullImageUrl(data.site.favicon) : '';

    Object.assign(seoForm, data.seo);
    originalSeoForm.value = { ...data.seo };

    Object.assign(legalForm, data.legal);
    originalLegalForm.value = { ...data.legal };

    Object.assign(securityForm, data.security);
    originalSecurityForm.value = { ...data.security };

    Object.assign(emailForm, data.email);
    originalEmailForm.value = { ...data.email };
  } catch (e: any) {
    ElMessage.error('加载设置失败');
  } finally {
    loading.value = false;
  }
}

async function uploadAndSetLogo(file: File) {
  try {
    const res = await systemApi.uploadImage(file);
    const resp = res.data as any;
    const url = resp.data?.url || resp.url;
    if (url) {
      siteForm.logo = url;
      logoPreview.value = getFullImageUrl(url);
    }
  } catch {
    ElMessage.error('Logo 上传失败');
  }
}

async function uploadAndSetFavicon(file: File) {
  try {
    const res = await systemApi.uploadImage(file);
    const resp = res.data as any;
    const url = resp.data?.url || resp.url;
    if (url) {
      siteForm.favicon = url;
      faviconPreview.value = getFullImageUrl(url);
    }
  } catch {
    ElMessage.error('图标上传失败');
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

function getFullImageUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('//')) {
    return path.startsWith('//') ? window.location.protocol + path : path;
  }
  if (path.startsWith('/')) {
    return path;
  }
  return path;
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
  logoPreview.value = originalSiteForm.value.logo ? getFullImageUrl(originalSiteForm.value.logo) : '';
  faviconPreview.value = originalSiteForm.value.favicon ? getFullImageUrl(originalSiteForm.value.favicon) : '';
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

onMounted(() => {
  loadSettings();
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

.input-hint {
  margin-left: 12px;
  font-family: var(--font-serif);
  font-size: 13px;
  color: rgba(38, 37, 30, 0.5);
}
</style>
