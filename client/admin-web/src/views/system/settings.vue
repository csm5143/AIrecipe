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
              <el-form-item label="网站名称">
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
                <div class="logo-upload">
                  <el-upload
                    action="#"
                    :auto-upload="false"
                    :show-file-list="false"
                    accept="image/*"
                    @change="handleLogoChange"
                  >
                    <img v-if="logoPreview || siteForm.logo" :src="logoPreview || siteForm.logo" class="logo-preview" />
                    <div v-else class="upload-placeholder">
                      <el-icon><Plus /></el-icon>
                      <span>上传 Logo</span>
                    </div>
                  </el-upload>
                </div>
              </el-form-item>
              <el-form-item label="网站图标">
                <el-upload
                  action="#"
                  :auto-upload="false"
                  :show-file-list="false"
                  accept="image/*"
                >
                  <el-button>上传图标</el-button>
                  <template #tip>
                    <span class="upload-tip">建议尺寸 32x32，支持 ICO 格式</span>
                  </template>
                </el-upload>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleSaveSite">保存设置</el-button>
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
                <el-button type="primary" @click="handleSaveSeo">保存设置</el-button>
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
                <el-button type="primary" @click="handleSaveLegal">保存设置</el-button>
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
                <el-button type="primary" @click="handleSaveSecurity">保存设置</el-button>
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
                <el-button type="primary" @click="handleSaveEmail" style="margin-left: 12px">保存设置</el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import {
  Setting,
  Globe,
  Key,
  Document,
  Lock,
  Message,
  Plus
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const activeSetting = ref('site');
const logoPreview = ref('');

const settingItems = [
  { key: 'site', label: '网站信息', icon: Globe },
  { key: 'seo', label: 'SEO 设置', icon: Document },
  { key: 'legal', label: '备案信息', icon: Setting },
  { key: 'security', label: '安全设置', icon: Lock },
  { key: 'email', label: '邮件设置', icon: Message },
];

const siteForm = reactive({
  siteName: 'AIRecipe',
  siteDescription: 'AIRecipe - 您的智能食谱助手',
  logo: '',
});

const seoForm = reactive({
  title: 'AIRecipe - 智能食谱推荐平台',
  keywords: '食谱,美食,烹饪,健康饮食,AI推荐',
  description: 'AIRecipe 提供智能食谱推荐、AI食材识别、健康饮食管理等功能的综合平台。',
});

const legalForm = reactive({
  icp: '',
  psbe: '',
  copyright: '© 2024 AIRecipe 版权所有',
  company: '',
  phone: '',
});

const securityForm = reactive({
  sessionTimeout: 60,
  maxLoginAttempts: 5,
  passwordRequirements: ['minLength', 'number'],
  enableOperationLog: true,
});

const emailForm = reactive({
  smtpHost: '',
  smtpPort: 465,
  encryption: 'ssl',
  fromEmail: '',
  fromName: 'AIRecipe',
  username: '',
  password: '',
});

function handleLogoChange(file: any) {
  logoPreview.value = URL.createObjectURL(file.raw);
  siteForm.logo = file.raw;
}

function handleSaveSite() {
  ElMessage.success('网站信息已保存');
}

function handleSaveSeo() {
  ElMessage.success('SEO 设置已保存');
}

function handleSaveLegal() {
  ElMessage.success('备案信息已保存');
}

function handleSaveSecurity() {
  ElMessage.success('安全设置已保存');
}

function handleSaveEmail() {
  ElMessage.success('邮件设置已保存');
}

function handleTestEmail() {
  ElMessage.success('测试邮件已发送');
}
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

.logo-upload {
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

  .logo-preview {
    width: 120px;
    height: 60px;
    object-fit: contain;
    display: block;
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

    .el-icon {
      font-size: 24px;
    }

    span {
      font-family: var(--font-display);
      font-size: 12px;
    }
  }
}

.upload-tip {
  margin-left: 12px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: rgba(38, 37, 30, 0.4);
}

.input-hint {
  margin-left: 12px;
  font-family: var(--font-serif);
  font-size: 13px;
  color: rgba(38, 37, 30, 0.5);
}
</style>
